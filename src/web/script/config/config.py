import configparser
import hashlib
import logging
import pathlib

class NoSuchPropertyException(Exception):
  pass

class SieveAccount:
  def __init__(self, section, config):
    self._config = config
    self._section = section

  def _has_property(self, name):
    return name in self._config[self._section]

  def _get_property(self, name):
    if self._has_property(name):
      return self._config[self._section][name]

    raise NoSuchPropertyException(f'Unknown Property "{name}"')

  def get_id(self):
    """
    Returns a unique id for the account it is derived from the name
    An guaranteed that is does not contain any non hex characters.
    """
    return hashlib.sha256(self.get_name().encode()).hexdigest()

  def get_name(self):
    return self._section

  def get_sieve_user(self, _request):
    raise Exception("No user name configured")

  def get_sieve_password(self, _request):
    raise Exception("No password configured")

  def get_auth_username(self, _request):
    raise Exception("No authorization configured")

  def get_sieve_host(self):
    return self._get_property("SieveHost")

  def get_sieve_port(self):
    return self._get_property("SievePort")

  def can_authorize(self):
    return False

  def can_authenticate(self):
    return False


class SieveClientAccount(SieveAccount):

  def get_auth_username(self, request):

    if self._has_property("AuthUser"):
      user = self._config[self._section]["AuthUser"]
      logging.debug(f"Sieve user with client auth type and pre-configured AuthUser: {user}")
      return user

    header = self._get_property("AuthUserHeader")

    if request.get_header(header) is None:
      raise NoSuchPropertyException(f"No header {header} in request.")

    user = request.get_header(header)
    logging.debug(f"Sieve user with client auth type via {header} header: {user}")
    return user

  def can_authorize(self):
    return self._config[self._section].getboolean("AuthClientAuthorization", fallback=False)

  def can_authenticate(self):
    if self._config[self._section]["AuthType"].lower() == "client":
      return True

    return False

class SieveTokenAccount(SieveAccount):

  def get_auth_username(self, request):
    return self.get_sieve_user(request)

  def get_sieve_user(self, request):

    header = self._get_property("AuthUserHeader")

    if request.get_header(header) is None:
      raise NoSuchPropertyException(f"No header {header} in request.")

    user = request.get_header(header)
    logging.debug(f"Sieve user with token auth type via {header} header: {user}")
    return user

  def get_sieve_password(self, request):

    header = self._get_property("AuthPasswordHeader")

    if request.get_header(header) is None:
      raise NoSuchPropertyException(f"No header {header} in request.")

    return request.get_header(header)

class SieveAuthorizationAccount(SieveAccount):

  def get_sieve_user(self, _request):
    return self._get_property("SieveUser")

  def get_sieve_password(self, _request):
    return self._get_property("SievePassword")

  def get_auth_username(self, request):
    """
    Returns the request authorization if existing and if not the sections
    AuthUser settings.
    """

    if self._has_property("AuthUserHeader"):
      header = self._get_property("AuthUserHeader")

      if request.get_header(header) is not None:
        user = request.get_header(header)
        logging.debug(f"Sieve user with authorization auth type via {header} header: {user}")
        return user
      else:
        logging.warning(f"{header} header didn't arrive to identify Sieve user with authorization auth type. "
                        "Falling back to AuthUser config option.")

    ## FIXME only temporarily disabled
    #raise NoSuchPropertyException("Invalid username")

    user = self._config[self._section]["AuthUser"]
    logging.debug(f"Sieve user with authorization auth type and pre-configured AuthUser: {user}")
    return user


class Config:
  def __init__(self):
    self._config = configparser.ConfigParser()

  def load(self, name):
    self._config.read(name)
    return self

  def get_http_root(self):
    """
    Retruns the path to the http root containing the static files.
    """
    if "HttpRoot" in self._config["DEFAULT"]:
      return self._config["DEFAULT"]["HttpRoot"]

    return pathlib.Path(pathlib.Path(__file__).parent.parent.parent.absolute(), "static")

  def get_port(self):
    """
    Returns the port on which the sieve proxy should be started.
    """
    return self._config["DEFAULT"]["ServerPort"]

  def get_address(self):
    """
    Returns the server address to which the connection should be bound.
    """
    return self._config["DEFAULT"]["ServerAddress"]

  def get_use_ssl(self):
    """
    Whether to use SSL/HTTPS
    """
    if "UseSSL" in self._config["DEFAULT"]:
        return self._config["DEFAULT"].getboolean("UseSSL")
    else:
        return True

  def get_keyfile(self):
    """
    The keyfile used for securing the server.
    """
    if self.get_use_ssl() and "ServerKeyFile" in self._config["DEFAULT"]:
        return self._config["DEFAULT"]["ServerKeyFile"]
    else:
        return None

  def get_certfile(self):
    """
    The certificate file used for securing the server.
    """
    if self.get_use_ssl() and "ServerCertFile" in self._config["DEFAULT"]:
        return self._config["DEFAULT"]["ServerCertFile"]
    else:
        return None

  def get_auth_type(self, section : str):

    if "AuthType" not in self._config[section]:
      return "client"

    return self._config[section]["AuthType"].lower()

  def get_account_by_section(self, section: str) -> SieveAccount:
    """
    Returns the configuration
    """

    authtype = self.get_auth_type(section)

    if authtype == "client":
      return SieveClientAccount(section, self._config)

    if authtype == "token":
      return SieveTokenAccount(section, self._config)

    if authtype == "authorization":
      return SieveAuthorizationAccount(section, self._config)

    #if authtype == "server":
    #  return SieveServerAccount(section, self._config)

    raise NoSuchPropertyException(f"Invalid account type {authtype}")

  def get_account_by_id(self, account_id:str):
    """
    Returns the account by the unique id.
    """

    for section in self._config.sections():
      if hashlib.sha256(section.encode()).hexdigest() == account_id:
        return self.get_account_by_section(section)

    raise NoSuchPropertyException(f"Invalid account id {account_id}")

  def get_accounts(self):
    """
    Returns the settings for all known accounts.
    """

    accounts = []
    for section in self._config.sections():
      accounts.append(self.get_account_by_section(section))

    return accounts

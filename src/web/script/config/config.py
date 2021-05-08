import configparser
import hashlib

class NoSuchPropertyException(Exception):
  pass

class SieveAccount:
  def __init__(self, section, config):
    self._config = config
    self._section = section

  def _get_property(self, name):
    if name in self._config[self._section]:
      return self._config[self._section][name]

    raise NoSuchPropertyException("Unknown Property "+name)

  def get_id(self):
    """
    Returns a unique id for the account it is derived from the name
    An guaranteed that is does not contain any non hex characters.
    """
    return hashlib.sha256(self.get_name().encode()).hexdigest()

  def get_name(self):
    return self._section

  def get_client_host(self):
    try:
      return self._get_property("ClientHost")
    except NoSuchPropertyException:
      return self.get_sieve_host()

  def get_client_port(self):
    try:
      return self._get_property("ClientPort")
    except NoSuchPropertyException:
      return self.get_sieve_port()

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

    if "AuthUser" in self._config[self._section] :
      return self._config[self._section]["AuthUser"]

    if request.get_header("REMOTE_USER") is None:
      return request.get_header("REMOTE_USER")

    raise NoSuchPropertyException("Invalid username")

  def can_authorize(self):
    return self._config[self._section].getboolean("AuthClientAuthorization", fallback=False )

  def can_authenticate(self):
    if self._config[self._section]["AuthType"].lower() == "client":
      return True

    return False

class SieveServerAccount(SieveAccount):

  def get_auth_username(self, request):


    if request.get_header("REMOTE_USER") is not None:
      return request.get_header("REMOTE_USER")

    ## FIXME only temporarily disabled
    #raise NoSuchPropertyException("Invalid username")

    return self._config[self._section]["AuthUser"]

  def get_sieve_user(self):
    return self._get_property("SieveUser")

  def get_sieve_password(self):
    return self._get_property("SievePassword")

class Config:
  def __init__(self):
    self._config = configparser.ConfigParser()

  def load(self, name):
    self._config.read(name)
    return self

  def get_keyfile(self):
    return self._config["DEFAULT"]["ServerKeyFile"]

  def get_certfile(self):
    return self._config["DEFAULT"]["ServerCertFile"]

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

    if authtype == "server":
      return SieveServerAccount(section, self._config)

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

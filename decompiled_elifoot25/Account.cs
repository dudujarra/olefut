public class Account
{
	public string guid;

	public string coachName;

	public string email;

	public string password;

	public Account(string guid = "", string coachName = "", string email = "", string password = "")
	{
		this.guid = guid;
		this.coachName = coachName;
		this.email = email;
		this.password = password;
	}

	public bool HasCredentials()
	{
		if (!string.IsNullOrEmpty(email))
		{
			return !string.IsNullOrEmpty(password);
		}
		return false;
	}
}

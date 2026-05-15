using System;

[Serializable]
public class Promotion : PromotionBase
{
	public string type;

	public string validationCode;

	public string caption;

	public string bodyText;

	public InAppPurchases.GameItemType gameItemType;

	public int gameValue;

	public bool persistent;

	public int used;

	public int nextShow;

	public void Use(bool showDialogs)
	{
		if ((!persistent && used >= base.PromotionValue) || Util.GetRandomInt(base.Period) > 0)
		{
			return;
		}
		switch (type)
		{
		case "FREE_COINS":
			ElifootOptions.totalCoins += gameValue;
			ElifootOptions.SaveOptions();
			if (showDialogs)
			{
				ScreenController.instance.ShowDialogPopUp(caption, bodyText, null);
			}
			used++;
			break;
		case "UPGRADE_VIP":
			if (GamePermissions.GetCurRegLevel() <= PermissionLevel.L5_VIP && GamePermissions.GetPremiumAccessLevel() < PermissionLevel.L5_VIP && showDialogs)
			{
				ScreenController.instance.ShowDialogPopUp(caption, bodyText, null);
			}
			GamePermissions.upgradeVip = true;
			ElifootOptions.extras.vipVersion = true;
			GamePermissions.ComputeRegLevel();
			used++;
			break;
		case "UPGRADE_PREMIUM":
			if (GamePermissions.GetCurRegLevel() <= PermissionLevel.L6_Premium && GamePermissions.GetPremiumAccessLevel() < PermissionLevel.L6_Premium && showDialogs)
			{
				ScreenController.instance.ShowDialogPopUp(caption, bodyText, null);
			}
			GamePermissions.upgradePremium = true;
			ElifootOptions.extras.premiumVersion = true;
			GamePermissions.ComputeRegLevel();
			used++;
			break;
		}
	}
}

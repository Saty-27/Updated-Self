import { SiteSetting } from "./models.js";
import { publicSiteSettings, siteSettingsUpdateInput } from "./siteSettingsValidation.js";

export const attachSiteSettingsRoutes = (app, { adminOnly, asyncHandler, recordActivity }) => {
  app.get("/api/site-settings", asyncHandler(async (req, res) => {
    const settings = await SiteSetting.findOne({ singletonKey: "site" }).lean();
    res.json({ success: true, settings: publicSiteSettings(settings || {}) });
  }));

  app.get("/api/admin/site-settings", ...adminOnly, asyncHandler(async (req, res) => {
    const settings = await SiteSetting.findOne({ singletonKey: "site" }).lean();
    res.json({ success: true, settings });
  }));

  app.put("/api/admin/site-settings", ...adminOnly, asyncHandler(async (req, res) => {
    const update = siteSettingsUpdateInput(req.body);
    const settings = await SiteSetting.findOneAndUpdate(
      { singletonKey: "site" },
      { $set: { ...update, singletonKey: "site" }, $unset: { customHeaderHtml: 1 } },
      { new: true, upsert: true, runValidators: true }
    );
    await recordActivity(req, {
      action: "update",
      section: "site-settings",
      resource: "site-settings",
      resourceId: String(settings._id),
      label: "Site settings updated",
      changedFields: Object.keys(update)
    });
    res.json({ success: true, settings });
  }));
};

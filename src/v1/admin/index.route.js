const index = (prop) => {
  // Declaration
  prop.main_route = "api/v1/admin";

  // All Route ==========================
  const authRoute = require("./auth/auth.route");
  const sessionRoute = require("./session/session.route");
  const userRoute = require("./user/user.route");
  const userGroupRoute = require("./user/group/group_user.route");
  const activityLogRoute = require("./activity_log/activity_log.route");
  const activityLogCategoryRoute = require("./activity_log_category/activity_log_category.route");
  const masterData_JobType = require("./dashboard/master_data/job/job_type/job_type.route");
  const masterData_Job = require("./dashboard/master_data/job/job_name/job.route");
  const masterData_EducationType = require("./dashboard/master_data/education/education_type/education_type.route");
  const masterData_EducationLevel = require("./dashboard/master_data/education/education_level/education_level.route");
  const masterData_RoleInParty = require("./dashboard/master_data/role_in_party/role_in_party.route");
  const masterData_OfficeElection = require("./dashboard/master_data/office_election/office_election.route");
  const masterData_AreaPin_Province = require("./dashboard/master_data/area_pin/province/province.route");
  const masterData_AreaPin_Disctrict = require("./dashboard/master_data/area_pin/disctrict/district.route");
  const masterData_AreaPin_Commues = require("./dashboard/master_data/area_pin/commues/commues.route");
  const masterData_AreaPin_Villages = require("./dashboard/master_data/area_pin/villages/villages.route");
  const masterData_AreaPin_VillagesMore = require("./dashboard/master_data/area_pin/villages/more/villages_more.route");
  const masterData_AreaPin_ElectionOffice = require("../mobile/area_data/election_office/election_office.route");
  const masterData_AreaPin_GetAll = require("./dashboard/master_data/area_pin/all/area_pin_all.route");
  const masterData_PartyCount = require("./dashboard/master_data/party/count/count.route");
  const areaKhmer = require("../../area/area.route");
  // const areaManagement_Peopel = require("./dashboard/area_management/party_member/party_member.route");
  // const app_AreaData_PartyMember_Count = require("../mobile/area_data/party/count.route");
  const app_AreaData_FilterArea = require("../mobile/area_data/filter_area_by_name/filter_area_by_name.route");
  const app_AreaData_Geopgraphy = require("../mobile/area_data/geography/count.route");
  const app_AreaData_PeopleCount = require("../mobile/area_data/people/count.route");
  const action = require("../admin/dashboard/action/action.route");
  const ChallengeType = require("../admin/dashboard/challenge/type/type.route");
  const ChallengeProblem = require("../admin/dashboard/challenge/problem/problem.route");
  const GenerateQRCodeLogin = require("../qrcode/authQRCodeLogin.route");
  const Temp = require("../../temp/temp.route");
  // Implement ==========================
  authRoute(prop); // Auth
  sessionRoute(prop); // Auth
  userRoute(prop); // User
  userGroupRoute(prop); // Group Permission
  activityLogRoute(prop); // Log
  activityLogCategoryRoute(prop); // Log
  masterData_Job(prop);
  masterData_EducationType(prop);
  masterData_EducationLevel(prop);
  masterData_JobType(prop);
  masterData_RoleInParty(prop);
  masterData_OfficeElection(prop);
  masterData_AreaPin_Province(prop);
  masterData_AreaPin_Disctrict(prop);
  masterData_AreaPin_Commues(prop);
  masterData_AreaPin_Villages(prop);
  masterData_AreaPin_VillagesMore(prop);
  masterData_AreaPin_ElectionOffice(prop);
  masterData_AreaPin_GetAll(prop);
  masterData_PartyCount(prop);
  areaKhmer(prop);
  // areaManagement_Peopel(prop);
  // app_AreaData_PartyMember_Count(prop);
  app_AreaData_FilterArea(prop);
  app_AreaData_Geopgraphy(prop);
  app_AreaData_PeopleCount(prop);
  action(prop);
  ChallengeType(prop);
  ChallengeProblem(prop);
  GenerateQRCodeLogin(prop);
  Temp(prop);
};

module.exports = index;

import { request } from "./api";
import { confirmAccountIdentity, currentAuthUser } from "./auth";
import { emitDataChanged } from "./dataEvents";

const config = { timeoutMs: 30000, timeoutMessage: "관리 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." };

export async function getAdminAccess(user) {
  if (!user || user.isAnonymous) return { admin: false };
  // 권한을 나중에 부여해도 설정에 다시 들어오면 새 토큰으로 확인한다.
  await user.getIdToken(true);
  if (currentAuthUser()?.uid !== user.uid) throw new Error("로그인한 계정이 변경됐어요.");
  return request("/api/me/access", {}, { ...config, user });
}

const queryString = values => Object.entries(values).filter(([, value]) => value !== "" && value != null)
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
export const getAdminUsers = ({ q = "", kind = "all", offset = 0 } = {}) => request(
  `/api/admin/users?${queryString({ q, kind, offset })}`, {}, config,
);
export const getAdminDocuments = ({ q = "", ownerUid = "", status = "all", offset = 0 } = {}) => request(
  `/api/admin/documents?${queryString({ q, owner_uid: ownerUid, status, offset })}`, {}, config,
);
export const retryFailedAnalysis = (ownerUid, documentId) => request(
  `/api/admin/documents/${encodeURIComponent(ownerUid)}/${encodeURIComponent(documentId)}/retry`,
  { method: "POST" },
  { timeoutMs: 300000, timeoutMessage: "재분석 응답이 지연되고 있어요. 목록을 새로고침해 처리 상태를 확인해 주세요." },
);
export const saveAnnouncement = (notice, published) => request(
  notice.id ? `/api/admin/announcements/${encodeURIComponent(notice.id)}` : "/api/admin/announcements",
  { method: notice.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: notice.title.trim(), body: notice.body.trim(), published, revision: notice.revision || 0 }) },
  config,
);
export const listAnnouncements = () => request("/api/announcements", {}, config);

const jsonRequest = (path, method, body, options = {}) => request(path, {
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
}, { ...config, ...options });
const userPath = uid => `/api/admin/users/${encodeURIComponent(uid)}`;
const documentPath = item => `/api/admin/documents/${encodeURIComponent(item.ownerUid)}/${encodeURIComponent(item.documentId)}`;
export const getAdminDocumentReview = item => request(`${documentPath(item)}/review`, {}, config);
export const getAdminReviewSource = (item, { page = 1, fieldId = "", updatedAt = "" } = {}) => request(
  `${documentPath(item)}/review/source?${queryString({ page, field_id: fieldId, updated_at: updatedAt })}`, {}, config,
);
async function confirmedRequest(path, method, body) {
  const user = currentAuthUser();
  if (!user) throw new Error("로그인이 필요해요.");
  await confirmAccountIdentity(user);
  if (currentAuthUser()?.uid !== user.uid) throw new Error("로그인한 계정이 변경됐어요.");
  const result = await jsonRequest(path, method, body, { user, timeoutMs: 120000 });
  emitDataChanged();
  return result;
}
export const setAdminUserDisabled = (uid, disabled) => confirmedRequest(userPath(uid), "PATCH", { disabled });
export const deleteAdminDocument = item => confirmedRequest(documentPath(item), "DELETE", { confirmed: true, targetId: item.documentId });
export const getAdminNotices = () => request("/api/admin/announcements", {}, config);

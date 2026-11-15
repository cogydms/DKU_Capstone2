import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import { Text, TextInput } from "../Typography";
import { deleteAdminDocument, retryFailedAnalysis, setAdminUserDisabled } from "../../services/adminApi";
import { colors, type } from "../../theme/theme";
import { useAdminAction } from "./AdminLayout";
import { AdminButton, AdminDialog, AdminFeedback, adminStyles as styles } from "./AdminControls";

export const accountLabel = user => user?.displayName || user?.email || (user?.accountType === "guest" ? "게스트 계정" : "이름 미등록 계정");

export function ConfirmAdminAction({ target, onClose, onChanged }) {
  const [confirmation, setConfirmation] = useState("");
  const action = useAdminAction();
  const { kind, item } = target;
  const deleting = kind === "deleteDocument";
  const title = kind === "deleteDocument" ? "문서 영구 삭제" : kind === "retry" ? "저장된 원문으로 재분석" : item.disabled ? "계정 재활성화" : "계정 사용 중지";
  const task = () => kind === "deleteDocument" ? deleteAdminDocument(item)
    : kind === "retry" ? retryFailedAnalysis(item.ownerUid, item.documentId) : setAdminUserDisabled(item.uid, !item.disabled);
  return <AdminDialog title={title} busy={action.busy} onClose={onClose}>
    <Text style={type.bodyStrong}>{item.title || accountLabel(item)}</Text>
    {!!item.email && <Text selectable style={type.small}>{item.email}</Text>}
    <Text style={type.body}>{kind === "deleteDocument" ? "이 문서의 원본·분석 결과·준비 계획과 연결된 할 일을 함께 영구 삭제해요. 복구할 수 없어요."
      : kind === "retry" ? "저장된 원문으로 다시 분석해 해당 사용자의 문서에 결과를 반영해요."
      : item.disabled ? "다시 로그인할 수 있게 해요. 이전 로그인 세션은 재사용할 수 없어요." : "이 계정의 앱 접근과 기존 로그인 세션을 차단해요. 문서와 할 일은 보관됩니다."}</Text>
    {deleting && <TextInput accessibilityLabel="삭제 확인 문구" placeholder="계속하려면 ‘삭제’를 입력해 주세요." value={confirmation} onChangeText={setConfirmation} editable={!action.busy} style={styles.input} />}
    {kind !== "retry" && <Text style={type.small}>진행하면 관리자 Google 계정을 다시 확인합니다.</Text>}
    <AdminFeedback {...action} />{action.busy && <ActivityIndicator color={colors.stamp} />}
    <AdminButton label={action.busy ? "처리 중…" : title} danger={deleting || (kind === "disabled" && !item.disabled)} disabled={action.busy || (deleting && confirmation.trim() !== "삭제")}
      onPress={async () => {
        const ok = await action.run(task, () => { onChanged(); onClose(); });
        if (!ok) onChanged();
      }} />
  </AdminDialog>;
}

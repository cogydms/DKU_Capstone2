export const needsEvidenceReview = (status) => status === "needs_review" || status === "unverified";

export function splitAnalysisItems(sections, fields) {
  const reviewFields = fields.filter((field) => needsEvidenceReview(field.status));
  const confirmedFields = fields.filter((field) => field.status === "user_confirmed");
  if (!reviewFields.length && !confirmedFields.length) return { reviewFields, normalSections: sections };

  const reviewIds = new Set(reviewFields.map((field) => field.id));
  // 신청 기간의 한 줄은 시작일과 마감일을 함께 표시할 수 있다.
  const periodPair = ["application_start", "deadline"].map((key) =>
    fields.find((field) => field.key === key && field.status !== "unverified")
  );
  const splitPeriod = periodPair.every(Boolean) && periodPair.some((field) => field.status !== "verified");

  const normalSections = sections.flatMap((section) => {
    if (section.key === "period" && splitPeriod &&
      section.items.some((item) => periodPair.some((field) => field.id === item.fieldId))) {
      const remaining = periodPair.filter((field) => !reviewIds.has(field.id));
      if (!remaining.length) return [];
      return [{
        ...section,
        title: remaining.length === 1 ? remaining[0].label : section.title,
        confidence: Math.min(...remaining.map((field) => field.confidence)),
        items: remaining.map((field) => ({
          fieldId: field.id,
          text: remaining.length === 1 ? field.value : `${field.label} · ${field.value}`,
          status: field.status,
        })),
      }];
    }

    const items = section.items.filter((item) => !reviewIds.has(item.fieldId));
    if (!items.length) return [];
    if (items.length === section.items.length) return [section];
    return [{ ...section, items, confidence: Math.min(...items.map((item) => item.confidence ?? 100)) }];
  });
  const shownIds = new Set(normalSections.flatMap((section) => section.items.map((item) => item.fieldId)));
  const otherConfirmed = confirmedFields.filter((field) => !shownIds.has(field.id));
  if (otherConfirmed.length) {
    normalSections.push({
      key: "confirmed",
      title: "그 밖의 직접 확인 항목",
      items: otherConfirmed.map((field) => ({
        fieldId: field.id,
        text: `${field.label} · ${field.value}`,
        status: field.status,
      })),
    });
  }
  return { reviewFields, normalSections };
}

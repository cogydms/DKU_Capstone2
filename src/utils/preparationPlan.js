// 준비 계획의 날짜는 시간대 변환 없이 달력 날짜(YYYY-MM-DD)로 다룬다.
export function parsePlanDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1000 || year > 9999) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date : null;
}

export function formatStepDate(value) {
  const date = parsePlanDate(value);
  if (!date) return value;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${"일월화수목금토"[date.getDay()]})`;
}

export function formatDeadline(step) {
  if (!step) return "마감일 미정";
  const date = parsePlanDate(step.date);
  if (!date) return "마감일 미정";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일${step.time ? ` ${step.time}` : ""}`;
}

export function getDday(deadline, referenceDate) {
  const due = parsePlanDate(deadline);
  const today = parsePlanDate(referenceDate);
  if (!due || !today) return "미정";
  const days = Math.round((Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
    - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  return days === 0 ? "D-Day" : days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

export function sortPlanSteps(steps) {
  return [...steps].sort((a, b) => a.date.localeCompare(b.date)
    || Number(!!a.isDeadline) - Number(!!b.isDeadline)
    || (a.time || "").localeCompare(b.time || ""));
}

export function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours ? `${hours}시간` : "", minutes ? `${minutes}분` : ""].filter(Boolean).join(" ");
}

export function durationFromParts(hours, minutes) {
  const h = hours.trim();
  const m = minutes.trim();
  if (!h && !m) return null;
  if ((h && !/^\d+$/.test(h)) || (m && !/^\d+$/.test(m))) return NaN;
  if (Number(h) > 24 || Number(m) > 59) return NaN;
  const total = Number(h) * 60 + Number(m);
  return total > 0 && total <= 1440 ? total : NaN;
}

export function validatePlanStep(form, steps, editingId) {
  if (!form.label.trim()) return "일정 이름을 입력해 주세요.";
  if (!parsePlanDate(form.date.trim())) return "달력에서 날짜를 선택해 주세요.";
  if (form.time.trim() && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time.trim())) {
    return "시간 선택에서 시와 분을 다시 선택해 주세요.";
  }
  if (Number.isNaN(durationFromParts(form.durationHours, form.durationMinutes))) {
    return "예상 소요시간은 1분~24시간이며, 분은 0~59로 입력해 주세요.";
  }
  const deadline = steps.find((step) => step.isDeadline);
  if (deadline && editingId !== deadline.id && form.date.trim() > deadline.date) {
    return "준비 일정은 최종 마감일 이전 또는 같은 날로 지정해 주세요.";
  }
  if (deadline && editingId === deadline.id
    && steps.some((step) => !step.isDeadline && step.date > form.date.trim())) {
    return "최종 마감일은 준비 일정 이후 또는 같은 날로 지정해 주세요.";
  }
  return "";
}

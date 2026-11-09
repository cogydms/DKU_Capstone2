const EMAIL_PATTERN = /(^|[^A-Z0-9._%+'@-])([A-Z0-9_%+'-]+(?:\.[A-Z0-9_%+'-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?\.)+[A-Z]{2,})(?![A-Z0-9_@-]|\.[A-Z0-9_@-])/gi;

export function contactEmails(item) {
  if (!["verified", "user_confirmed"].includes(item.status)) return [];
  const matches = (item.text ?? "").matchAll(EMAIL_PATTERN);
  return [...new Set(Array.from(matches, (match) => match[2]))];
}

export function gmailComposeUrl(address, title) {
  const subject = title.replace(/[\r\n]+/g, " ").trim();
  return "https://mail.google.com/mail/?view=cm&fs=1"
    + "&to=" + encodeURIComponent(address)
    + "&su=" + encodeURIComponent(subject);
}

export async function signedInWithGoogle(user) {
  if (!user || user.isAnonymous) return false;
  const token = await user.getIdTokenResult();
  return token.signInProvider === "google.com";
}

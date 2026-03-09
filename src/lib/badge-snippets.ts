const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://provenance.app";

export function generateBadgeHtml(
  verificationId: string,
  typedPercentage: number
): string {
  const verifyUrl = `${APP_URL}/verify/${verificationId}`;
  const imageUrl = `${APP_URL}/api/badges/${verificationId}/image`;
  const altText = `Provenance ✓ | ${typedPercentage}% typed — Verified at ${verifyUrl}`;

  return `<a href="${verifyUrl}">
  <img src="${imageUrl}"
       alt="${altText}"
       width="170" height="28" />
</a>`;
}

export function generateBadgeMarkdown(
  verificationId: string,
  typedPercentage: number
): string {
  const verifyUrl = `${APP_URL}/verify/${verificationId}`;
  const imageUrl = `${APP_URL}/api/badges/${verificationId}/image`;

  return `[![Provenance ✓ | ${typedPercentage}% typed — Verified at ${verifyUrl}](${imageUrl})](${verifyUrl})`;
}

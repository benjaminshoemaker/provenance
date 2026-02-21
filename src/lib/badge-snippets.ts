const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://provenance.app";

export function generateBadgeHtml(
  verificationId: string,
  aiPercentage: number
): string {
  const verifyUrl = `${APP_URL}/verify/${verificationId}`;
  const imageUrl = `${APP_URL}/api/badges/${verificationId}/image`;
  const altText = `Provenance Verified: ${aiPercentage}% AI-generated — View full writing process audit at ${verifyUrl}`;

  return `<a href="${verifyUrl}">
  <img src="${imageUrl}"
       alt="${altText}"
       width="200" height="40" />
</a>`;
}

export function generateBadgeMarkdown(
  verificationId: string,
  aiPercentage: number
): string {
  const verifyUrl = `${APP_URL}/verify/${verificationId}`;
  const imageUrl = `${APP_URL}/api/badges/${verificationId}/image`;

  return `[![Provenance Verified: ${aiPercentage}% AI-generated](${imageUrl})](${verifyUrl})`;
}

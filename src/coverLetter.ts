export async function getCoverLetter(
  jobDescription: string,
  resume: string,
  companyInfo: string
): Promise<string> {
  // Basic implementation that will be enhanced later
  return `
Dear Hiring Manager,

I am writing to express my interest in the position. Based on the job description and my experience, I believe I would be a great fit for this role.

${resume}

${companyInfo}

I look forward to the opportunity to discuss how my skills and experience align with your needs.

Sincerely,
[Your Name]
`;
} 
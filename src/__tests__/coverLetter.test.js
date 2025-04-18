import test from 'ava';
import { getCoverLetter } from '../coverLetter.js';

test('should generate a cover letter with all required sections', async (t) => {
  const jobDescription = 'Looking for a software engineer with experience in TypeScript and React.';
  const resume = 'Experienced software engineer with 5 years of experience in web development.';
  const companyInfo = 'Tech company focused on building innovative web applications.';
  
  const coverLetter = await getCoverLetter(jobDescription, resume, companyInfo);
  
  t.truthy(coverLetter);
  t.true(coverLetter.includes('Dear Hiring Manager'));
  t.true(coverLetter.includes('Sincerely'));
});

test('should handle empty inputs gracefully', async (t) => {
  const coverLetter = await getCoverLetter('', '', '');
  t.truthy(coverLetter);
  t.true(coverLetter.length > 0);
}); 
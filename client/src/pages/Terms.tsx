import MarketingLayout from "@/components/MarketingLayout";
import { Link } from "wouter";

export default function Terms() {
  const lastUpdated = "November 30, 2024";

  return (
    <MarketingLayout>
      <section className="pt-16 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="p-6 bg-muted rounded-lg mb-8">
              <p className="text-sm text-muted-foreground m-0">
                Please read these Terms of Service carefully before using SkillSync AI. By accessing or using our service, you agree to be bound by these terms.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By accessing or using the SkillSync AI platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                These Terms apply to all visitors, users, and others who access or use the Service, including job seekers, employers, and platform administrators.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                SkillSync AI provides an AI-powered talent matching platform that connects job seekers with employers. Our services include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>AI-powered job and candidate matching</li>
                <li>Resume parsing and skill extraction</li>
                <li>Personalized learning roadmaps</li>
                <li>Skill verification and assessment tools</li>
                <li>Hiring pipeline management</li>
                <li>Analytics and reporting</li>
                <li>Third-party integrations (Slack, GitHub, etc.)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">3. User Accounts</h2>
              <h3 className="font-semibold text-lg mb-2">3.1 Registration</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate and current.
              </p>
              <h3 className="font-semibold text-lg mb-2">3.2 Account Security</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We recommend enabling two-factor authentication for enhanced security.
              </p>
              <h3 className="font-semibold text-lg mb-2">3.3 Account Types</h3>
              <p className="text-muted-foreground leading-relaxed">
                We offer different account types: Job Seeker accounts (free), Employer accounts (various subscription tiers), and Administrator accounts. Each account type has different features and permissions as described on our pricing page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">4. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Providing false or misleading information in your profile or job postings</li>
                <li>Impersonating another person or entity</li>
                <li>Using the Service for any unlawful purpose</li>
                <li>Harassing, abusing, or discriminating against other users</li>
                <li>Attempting to interfere with or disrupt the Service</li>
                <li>Scraping or collecting user data without authorization</li>
                <li>Circumventing any security measures or access controls</li>
                <li>Using automated systems (bots) without prior authorization</li>
                <li>Posting spam, advertisements, or promotional content inappropriately</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">5. Intellectual Property</h2>
              <h3 className="font-semibold text-lg mb-2">5.1 Our Content</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Service and its original content (excluding user-provided content), features, and functionality are owned by SkillSync AI and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <h3 className="font-semibold text-lg mb-2">5.2 Your Content</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You retain ownership of any content you submit to the Service (resumes, job descriptions, etc.). By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, process, and display your content as necessary to provide the Service.
              </p>
              <h3 className="font-semibold text-lg mb-2">5.3 AI-Generated Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                Content generated by our AI (match explanations, skill analyses, learning recommendations) is provided as guidance and does not constitute professional advice. You are free to use such content for your personal or business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">6. Subscription and Payments</h2>
              <h3 className="font-semibold text-lg mb-2">6.1 Pricing</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Subscription fees are as stated on our pricing page. We reserve the right to change our prices with 30 days' notice. Price changes do not affect current subscription periods.
              </p>
              <h3 className="font-semibold text-lg mb-2">6.2 Billing</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as explicitly stated in these Terms.
              </p>
              <h3 className="font-semibold text-lg mb-2">6.3 Free Trial</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may offer free trial periods for paid plans. At the end of the trial, your subscription will automatically convert to a paid plan unless you cancel before the trial ends.
              </p>
              <h3 className="font-semibold text-lg mb-2">6.4 Cancellation</h3>
              <p className="text-muted-foreground leading-relaxed">
                You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. You will retain access to paid features until the period ends.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">7. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your privacy is important to us. Our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> explains how we collect, use, and protect your personal information. By using the Service, you consent to our data practices as described in the Privacy Policy.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We comply with applicable data protection laws including GDPR for users in the European Economic Area. You have rights regarding your personal data including access, correction, deletion, and portability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">8. Disclaimers</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>The Service will meet your specific requirements</li>
                <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                <li>AI-generated matches or recommendations will be accurate or suitable</li>
                <li>Any job seeker will be hired or any employer will find suitable candidates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                AI-generated content is provided for informational purposes only and should not be considered professional career, legal, or business advice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKILLSYNC AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless SkillSync AI and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of another party.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                You may terminate your account at any time by contacting us or using the account deletion feature. We will retain certain data as required by law or for legitimate business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">13. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of Delaware.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">14. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  <strong>SkillSync AI</strong><br />
                  Email: legal@skillsync.ai<br />
                  Address: 123 Innovation Way, San Francisco, CA 94105
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}


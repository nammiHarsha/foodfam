import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";

const CommunityGuidelines = () => {
  return (
    <Layout>
      <SEOHead
        title="Community Guidelines | FoodFam"
        description="Our community guidelines for creating a safe and welcoming food-sharing community."
      />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold mb-8">Community Guidelines</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <p className="text-foreground font-medium text-lg">
            FoodFam is built on trust, respect, and a shared love of food. These guidelines 
            help us maintain a safe and welcoming community for everyone.
          </p>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              🤝 Be Respectful
            </h2>
            <p>
              Treat all community members with kindness and respect. We celebrate diversity 
              in cultures, cuisines, and backgrounds. Discrimination, harassment, or hate 
              speech of any kind is not tolerated.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              ✨ Be Authentic
            </h2>
            <p>
              Use your real identity and provide accurate information about yourself and 
              your experiences. Authentic connections are the heart of our community.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              🍳 Food Safety First
            </h2>
            <p>Hosts must:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Follow local food safety regulations</li>
              <li>Clearly communicate ingredients and potential allergens</li>
              <li>Maintain a clean and safe cooking environment</li>
              <li>Accommodate dietary restrictions when possible</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              💬 Communicate Clearly
            </h2>
            <p>
              Respond to messages promptly. If you need to cancel, do so as early as possible. 
              Clear communication helps build trust and ensures great experiences for everyone.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              📸 Respect Privacy
            </h2>
            <p>
              Ask permission before taking photos of others or their homes. Do not share 
              personal information about other members without their consent.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              ⭐ Leave Honest Reviews
            </h2>
            <p>
              Reviews help our community thrive. Be honest, constructive, and fair. 
              Focus on the experience itself rather than personal disputes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              🚫 What's Not Allowed
            </h2>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Harassment, threats, or abusive behavior</li>
              <li>Discrimination based on race, gender, religion, etc.</li>
              <li>Spam or commercial solicitation</li>
              <li>Illegal activities</li>
              <li>Fraudulent or misleading content</li>
              <li>Violating others' privacy</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mt-8 mb-4">
              📢 Reporting Issues
            </h2>
            <p>
              If you encounter behavior that violates these guidelines, please report it 
              using the report feature or contact us at safety@foodfam.com. We take all 
              reports seriously and will investigate promptly.
            </p>
          </section>

          <section className="bg-secondary/50 p-6 rounded-lg mt-8">
            <p className="text-foreground font-medium">
              Violations of these guidelines may result in warnings, temporary suspension, 
              or permanent removal from FoodFam. Thank you for helping us build a wonderful 
              community! 🍲
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityGuidelines;

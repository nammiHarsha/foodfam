import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
}

const SEOHead = ({
  title = "FoodFam - Connect Through Food & Culture",
  description = "Join a global community of food lovers. Host authentic dining experiences, discover local cuisines, and make meaningful connections through the universal language of food.",
  keywords = "food community, home cooking, cultural experiences, food travel, local dining, authentic cuisine, food lovers",
  ogImage = "/og-image.jpg",
  ogType = "website",
  canonicalUrl,
}: SEOHeadProps) => {
  const fullTitle = title.includes("FoodFam") ? title : `${title} | FoodFam`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
};

export default SEOHead;

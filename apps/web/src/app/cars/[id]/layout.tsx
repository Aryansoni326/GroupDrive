import type { Metadata } from "next";
import {
  MOCK_CATALOGUE_MODELS,
  MOCK_CATALOGUE_VARIANTS,
} from "@groupdrive/api-client";

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const modelId = params.id;
  const model = MOCK_CATALOGUE_MODELS.find(
    (m) =>
      m.id === modelId ||
      m.name.toLowerCase() === decodeURIComponent(modelId).toLowerCase()
  );

  if (!model) {
    return {
      title: "Vehicle Details",
      description:
        "Explore complete vehicle technical specifications, authorized dealer quotes, and collective group buying discounts on GROUPDRIVE.",
    };
  }

  const variants = MOCK_CATALOGUE_VARIANTS.filter((v) => v.model_id === model.id);
  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((v) => v.official_ex_showroom_price))
      : 800000;
  const formattedMinPrice = `Rs. ${(minPrice / 100000).toFixed(2)} Lakh`;

  const title = `${model.brand_name} ${model.name} Price, Specs & Group Deals`;
  const description = `Explore the ${model.brand_name} ${model.name} (${model.body_type}) starting at ${formattedMinPrice}. View genuine OEM specifications, real-world mileage, and join active buyer groups for verified dealer discounts on GROUPDRIVE.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/cars/${params.id}`,
    },
    openGraph: {
      title: `${model.brand_name} ${model.name} | GROUPDRIVE`,
      description,
      url: `/cars/${params.id}`,
      images: [
        {
          url: model.image_url,
          width: 1200,
          height: 630,
          alt: `${model.brand_name} ${model.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${model.brand_name} ${model.name} - Official Specs & Group Discounts`,
      description,
      images: [model.image_url],
    },
  };
}

export default function VehicleDetailLayout({ params, children }: Props) {
  const modelId = params.id;
  const model = MOCK_CATALOGUE_MODELS.find(
    (m) =>
      m.id === modelId ||
      m.name.toLowerCase() === decodeURIComponent(modelId).toLowerCase()
  );

  const variants = model
    ? MOCK_CATALOGUE_VARIANTS.filter((v) => v.model_id === model.id)
    : [];
  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((v) => v.official_ex_showroom_price))
      : 800000;
  const maxPrice =
    variants.length > 0
      ? Math.max(...variants.map((v) => v.official_ex_showroom_price))
      : 2000000;

  const vehicleSchema = model
    ? {
        "@context": "https://schema.org",
        "@type": "Car",
        name: `${model.brand_name} ${model.name}`,
        brand: {
          "@type": "Brand",
          name: model.brand_name,
        },
        model: model.name,
        bodyType: model.body_type,
        seatingCapacity: model.seating_capacity,
        image: model.image_url,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: minPrice,
          highPrice: maxPrice,
          offerCount: variants.length || 1,
          availability: "https://schema.org/InStock",
          priceValidUntil: "2026-12-31",
        },
      }
    : null;

  return (
    <>
      {vehicleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleSchema) }}
        />
      )}
      {children}
    </>
  );
}


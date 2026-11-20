import type { Metadata } from "next";
import { MOCK_PUBLIC_BUYER_GROUPS } from "@groupdrive/api-client";
import { formatINR } from "@groupdrive/utils";

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const groupId = params.id;
  const group = MOCK_PUBLIC_BUYER_GROUPS.find((g) => g.id === groupId);

  if (!group) {
    return {
      title: "Group Buying Opportunity",
      description:
        "Join collective buyer pools to aggregate car buying demand and unlock institutional discounts from authorized automobile dealers on GROUPDRIVE.",
    };
  }

  const savings = group.estimated_savings_inr || 45000;
  const imageUrl =
    group.model_image_url ||
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800";

  const title = `${group.model_name} Group Buying Pool (${group.city}) - Save ~${formatINR(savings)}`;
  const description = `Join the verified buyer group for ${group.model_name} in ${group.city}, ${group.state}. ${group.current_members_count} verified buyers joined. Target savings of up to ${formatINR(savings)} with competitive OEM dealer bidding.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/groups/${params.id}`,
    },
    openGraph: {
      title: `${group.group_code}: ${group.model_name} Group Deal | GROUPDRIVE`,
      description,
      url: `/groups/${params.id}`,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: `${group.model_name} Group Deal`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${group.model_name} Group Buy - Save ${formatINR(savings)}`,
      description,
      images: [imageUrl],
    },
  };
}

export default function GroupDetailLayout({ params, children }: Props) {
  const groupId = params.id;
  const group = MOCK_PUBLIC_BUYER_GROUPS.find((g) => g.id === groupId);

  const imageUrl =
    group?.model_image_url ||
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800";

  const groupSchema = group
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${group.model_name} Collective Buying Pool`,
        description: `Collective purchase initiative for ${group.model_name} in ${group.city}, ${group.state}.`,
        image: imageUrl,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          eligibleRegion: {
            "@type": "Place",
            name: `${group.city}, ${group.state}`,
          },
          offerCount: group.current_members_count,
        },
      }
    : null;

  return (
    <>
      {groupSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(groupSchema) }}
        />
      )}
      {children}
    </>
  );
}

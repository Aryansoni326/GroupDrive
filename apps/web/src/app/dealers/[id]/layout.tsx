import type { Metadata } from "next";
import { MOCK_AUTHORIZED_DEALERS } from "@groupdrive/api-client";

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dealerId = params.id;
  const dealer = MOCK_AUTHORIZED_DEALERS.find((d) => d.id === dealerId);

  if (!dealer) {
    return {
      title: "Authorized Dealership Profile",
      description:
        "Connect with verified OEM authorized car dealerships, explore showroom inventory, and request official price quotations on GROUPDRIVE.",
    };
  }

  const title = `${dealer.trade_name} - Verified Dealership Profile`;
  const description = `${dealer.trade_name} is a verified ${dealer.oem_brand_franchise} dealership. View official branch locations, operating hours, exclusive dealer campaigns, and request quotes on GROUPDRIVE.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/dealers/${params.id}`,
    },
    openGraph: {
      title: `${dealer.trade_name} | GROUPDRIVE Dealer Network`,
      description,
      url: `/dealers/${params.id}`,
      images: [
        {
          url: dealer.logo_url,
          width: 800,
          height: 600,
          alt: dealer.trade_name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${dealer.trade_name} - Verified OEM Dealer`,
      description,
      images: [dealer.logo_url],
    },
  };
}

export default function DealerDetailLayout({ params, children }: Props) {
  const dealerId = params.id;
  const dealer = MOCK_AUTHORIZED_DEALERS.find((d) => d.id === dealerId);

  const dealerSchema = dealer
    ? {
        "@context": "https://schema.org",
        "@type": "AutoDealer",
        name: dealer.trade_name,
        legalName: dealer.legal_entity_name,
        description: dealer.description,
        telephone: dealer.primary_contact_phone,
        email: dealer.primary_contact_email,
        url: dealer.website_url,
        address: {
          "@type": "PostalAddress",
          streetAddress: dealer.registered_office_address,
          addressCountry: "IN",
        },
        openingHours: dealer.operating_hours,
      }
    : null;

  return (
    <>
      {dealerSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerSchema) }}
        />
      )}
      {children}
    </>
  );
}


import { NegotiationRoomClient } from "@/app/negotiations/[id]/NegotiationRoomClient";

const negotiation = {
  id: "b1b2c3d4-0000-4000-8000-000000000002",
  buyer_id: "buyer-1",
  seller_id: "seller-1",
  buyer: { codename: "KOPI SENJA" },
  seller: { codename: "ANONYMOUS SELLER #CRUD" },
  status: "COUNTER_OFFER",
  current_offer_btc: 0.00128,
  current_offer_xmr: 0,
  deal_buyer_agreed: true,
  deal_seller_agreed: false,
  listing: {
    title: "Sony WH-1000XM4 Hitam",
    images: [],
    location_city: "Jakarta Selatan",
    location_district: "Kebayoran Baru",
    fiat_estimate_idr: 2850000,
    price_btc: 0.00204,
    price_xmr: 0.81,
    condition: "USED",
    category: "ELEKTRONIK",
  },
};

const messages = [
  {
    id: "m1",
    sender_id: "seller-1",
    sender_role: "SELLER",
    content:
      "Headphone masih mulus, box dan pouch lengkap. Bisa cek langsung di lokasi.",
    created_at: new Date().toISOString(),
    read_at: new Date().toISOString(),
    is_deleted: false,
  },
  {
    id: "m2",
    sender_id: "buyer-1",
    sender_role: "BUYER",
    content: "Aku tawar 1.28 juta ya, bisa ketemu sore ini.",
    created_at: new Date().toISOString(),
    read_at: null,
    is_deleted: false,
  },
];

export default function PreviewNegoPage() {
  return (
    <NegotiationRoomClient
      negotiation={negotiation}
      messages={messages}
      session={{ userId: "buyer-1", role: "BUYER" }}
    />
  );
}

import { EscrowRoomClient } from "@/app/escrow/[id]/EscrowRoomClient";

const room = {
  id: "a1b2c3d4-0000-4000-8000-000000000001",
  buyer_id: "buyer-1",
  seller_id: "seller-1",
  buyer: { codename: "KOPI SENJA" },
  seller: { codename: "ANONYMOUS SELLER #CRUD" },
  midman: { codename: "PIXMART OWNER" },
  item_title: "Sony WH-1000XM4 Hitam",
  status: "PENDING",
  crypto_type: "BTC",
  agreed_price_btc: 0.00128,
  agreed_price_xmr: 0,
  payment_status: "AWAITING_PAYMENT",
  funds_held: false,
  funds_released: false,
  meeting_proposal: {
    location_name: "Starbucks Grand Indonesia Lt. 3",
    date: "2026-11-16",
    time: "15:30",
    proposed_by: "BUYER",
  },
  meeting_accepted: false,
  buyer_arrived: false,
  seller_arrived: false,
  buyer_confirmed: false,
  seller_confirmed: false,
  negotiation: {
    listing: {
      title: "Sony WH-1000XM4 Hitam",
      images: [],
      location_city: "Jakarta Selatan",
      location_district: "Kebayoran Baru",
      fiat_estimate_idr: 2850000,
      price_btc: 0.00204,
      price_xmr: 0.81,
      condition: "USED",
    },
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
    content: "Oke, aku setuju ketemu jam 3 sore di Grand Indonesia.",
    created_at: new Date().toISOString(),
    read_at: null,
    is_deleted: false,
  },
];

export default function PreviewEscrowPage() {
  return (
    <EscrowRoomClient
      room={room}
      messages={messages}
      session={{ userId: "buyer-1", role: "BUYER" }}
    />
  );
}

import type { Metadata } from "next";
import { ProfileScreen } from "./profile-screen";

export const metadata: Metadata = {
  title: "Profil — HP Lift",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}

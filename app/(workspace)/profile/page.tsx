import { getProfile } from "@/lib/fs-data"
import { ProfileEditor } from "@/components/profile/profile-editor"

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="font-prose text-2xl text-text-primary">Your Profile</h1>
        <p className="text-sm text-text-secondary mt-1">
          Keep your career profile up to date so opportunities can find you.
        </p>
      </div>
      <ProfileEditor profile={profile} />
    </div>
  )
}

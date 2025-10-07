import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  
  // Get phone number from user metadata or primary phone
  const phone = user?.primaryPhoneNumber?.phoneNumber || 
                user?.publicMetadata?.phone as string ||
                ''

  return <DashboardClient phone={phone} userName={user?.firstName || 'User'} />
}

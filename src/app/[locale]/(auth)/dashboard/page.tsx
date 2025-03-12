import { auth } from '@clerk/nextjs/server'
import { useTranslations } from 'next-intl';

import DashboardPage from '@/components/dashboard';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = async () => {
  const t = useTranslations('DashboardIndex');
  const { userId, redirectToSignIn } = await auth()
  if (!userId) return redirectToSignIn()

  return (
    <>
        <TitleBar
          title={t('title_bar')}
          description={t('title_bar_description')}
        />
     
      {userId
        ? (
            <DashboardPage sessionId={"sessionId"} userId={userId} />
          )
        : (
            <div className="p-4 text-center">
              {t('authentication_required')}
            </div>
          )}
    </>
  );
};

export default DashboardIndexPage;

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';

import DashboardPage from '@/components/dashboard';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');
  const { sessionId, userId } = useAuth();

  return (
    <>
        <TitleBar
          title={t('title_bar')}
          description={t('title_bar_description')}
        />
     
      {sessionId && userId
        ? (
            <DashboardPage sessionId={sessionId} userId={userId} />
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

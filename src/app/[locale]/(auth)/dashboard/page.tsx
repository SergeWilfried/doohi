import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';

import DashboardPage from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');
  const { sessionId, userId } = useAuth();

  return (
    <>
      <div className="flex items-center justify-between">
        <TitleBar
          title={t('title_bar')}
          description={t('title_bar_description')}
        />
        <Button
          onClick={() => {
          }}
        >
          Logout
        </Button>
      </div>
      <DashboardPage sessionId={sessionId!} userId={userId!} />
    </>
  );
};

export default DashboardIndexPage;

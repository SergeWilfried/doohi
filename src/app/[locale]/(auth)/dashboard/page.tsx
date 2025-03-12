import { useTranslations } from 'next-intl';

import DashboardPage from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');

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
      {sessionId && userId
        ? (
            <DashboardPage sessionId={""} userId={""} />
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

// app/dashboard/page.jsx (Server Component)
import { useTranslations } from 'next-intl';
import { TitleBar } from '@/features/dashboard/TitleBar';
import DashboardPage from '@/components/dashboard';

// You can add async if you need to fetch data
const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');
  
  // If you need to fetch data on the server:
  // const userData = await fetchUserData('user123');
  
  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />
      {/* Direct usage of the client component */}
      <DashboardPage 
        sessionId="sessionId" 
        userId="userId" 
        // Any other props you need to pass
      />
    </>
  );
};

export default DashboardIndexPage;

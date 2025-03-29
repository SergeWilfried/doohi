/* eslint-disable no-console */
'use client';

import {
  AlertCircle,
  DollarSign,
  Edit,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';

import { EditProjectOverlay } from '@/components/edit-project-overlay';
import { PayoutOverlay } from '@/components/payout-overlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TOrganization, TProject, TUser } from '@/models/Schema';
import { categoryIcons, statusIcons } from '@/types/types';



export default function DashboardPage({ sessionId, user, allProjects, allDonations }: { sessionId: string; user: TUser | TOrganization; allProjects: TProject[]; allDonations: any[]; }) {
  console.warn(sessionId);


  return (
    
}

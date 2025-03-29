'use client';

import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { createProject } from '@/app/actions/projects';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { TProject } from '@/models/Schema';

type StartProjectOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
};

const categories = ['Education', 'Community', 'Technology', 'Environment', 'Arts & Culture', 'Wellness'];

export function StartProjectOverlay({ isOpen, onClose }: StartProjectOverlayProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const router = useRouter();

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TProject>({
    mode: 'onChange',
    criteriaMode: 'all',
    shouldFocusError: true,
    reValidateMode: 'onSubmit',
  });

  const createNewProject: SubmitHandler<TProject> = async (data: TProject) => {
    await createProject(data);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    reset({});
    router.push('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start a New Project</DialogTitle>
          <DialogDescription>Fill in the details below to create your new crowdfunding project.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <form onSubmit={handleSubmit(createNewProject)}>
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                {...register('title')}
                id="title"
                placeholder="Enter project title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              {errors?.title && <span>{errors?.title?.message as ReactNode}</span>}

            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                {...register('description')}

                id="description"
                placeholder="Enter project description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Funding Goal</Label>
              <Input
                {...register('goal')}
                id="amount"
                placeholder="Enter funding goal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

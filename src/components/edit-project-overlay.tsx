'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditProjectProps {
  project: {
    title: string;
    description: string;
    goal: number;
    category: string;
    // add other fields as needed
  };
  onClose: () => void;
  onUpdate: (updatedProject: EditProjectProps['project']) => void;
}

export function EditProjectOverlay({ project, onClose, onUpdate }: EditProjectProps) {
  // function implementation here
}
  const [editedProject, setEditedProject] = useState(project);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setEditedProject({ ...editedProject, [name]: value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onUpdate(editedProject);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={editedProject.title} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={editedProject.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="goal">Funding Goal ($)</Label>
            <Input
              id="goal"
              name="goal"
              type="number"
              value={editedProject.goal}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" value={editedProject.category} onChange={handleInputChange} required />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

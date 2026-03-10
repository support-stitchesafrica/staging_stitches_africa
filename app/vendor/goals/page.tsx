'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
// import { GoalCard } from '@/components/vendor/goals/GoalCard';
// import { CreateGoalDialog } from '@/components/vendor/goals/CreateGoalDialog';
import { PerformanceGoal } from '@/types/vendor-analytics';
// TODO: Create API route for goals instead of direct firebase-admin import
// import { goalTrackingService } from '@/lib/vendor/goal-tracking-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernNavbar } from '@/components/vendor/modern-navbar';

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      // TODO: Replace with API call
      // const vendorGoals = await goalTrackingService.getVendorGoals(user.uid);
      // setGoals(vendorGoals);
      setGoals([]); // Temporary: empty array until API is implemented
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalCreated = (goal: PerformanceGoal) => {
    setGoals([goal, ...goals]);
  };

  const handleGoalDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      // TODO: Replace with API call
      // await goalTrackingService.deleteGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const activeGoals = goals.filter(g => g.status === 'on_track' || g.status === 'at_risk');
  const achievedGoals = goals.filter(g => g.status === 'achieved');
  const missedGoals = goals.filter(g => g.status === 'missed');

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ModernNavbar />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Goals</h1>
          <p className="text-gray-600 mt-1">
            Set and track goals to measure your business growth
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      </div>

      {/* Goals Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="achieved">
            Achieved ({achievedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="missed">
            Missed ({missedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({goals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activeGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No active goals
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first goal to start tracking your progress
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map(goal => (
                <Card key={goal.id}>
                  <CardHeader>
                    <CardTitle>{goal.metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Target: {goal.targetValue}</p>
                    <p>Current: {goal.currentValue}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achieved" className="space-y-6">
          {achievedGoals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No achieved goals yet
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {achievedGoals.map(goal => (
                <Card key={goal.id}>
                  <CardHeader>
                    <CardTitle>{goal.metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Target: {goal.targetValue}</p>
                    <p>Current: {goal.currentValue}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="missed" className="space-y-6">
          {missedGoals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No missed goals
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {missedGoals.map(goal => (
                <Card key={goal.id}>
                  <CardHeader>
                    <CardTitle>{goal.metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Target: {goal.targetValue}</p>
                    <p>Current: {goal.currentValue}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {goals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No goals yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first goal to start tracking your progress
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map(goal => (
                <Card key={goal.id}>
                  <CardHeader>
                    <CardTitle>{goal.metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Target: {goal.targetValue}</p>
                    <p>Current: {goal.currentValue}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Goal Dialog */}
      {/* TODO: Re-enable when API route is created */}
      {/* <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGoalCreated={handleGoalCreated}
        vendorId={user?.uid || ''}
      /> */}
    </div>
  );
}

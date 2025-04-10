'use client';

import React from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useForm} from "react-hook-form";
import {PieChart, Pie, Cell, ResponsiveContainer, Tooltip} from 'recharts';
import {Separator} from "@/components/ui/separator";
import {ScrollArea} from "@/components/ui/scroll-area";
import {toast} from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

const initialTransactions: Transaction[] = [
  {id: '1', date: '2024-07-20', description: 'Groceries', amount: 50, category: 'Food'},
  {id: '2', date: '2024-07-19', description: 'Gas', amount: 40, category: 'Transportation'},
  {id: '3', date: '2024-07-18', description: 'Dinner', amount: 60, category: 'Food'},
  {id: '4', date: '2024-07-17', description: 'Movie', amount: 20, category: 'Entertainment'},
];

const categoryColors: { [key: string]: string } = {
  Food: 'hsl(var(--chart-1))',
  Transportation: 'hsl(var(--chart-2))',
  Entertainment: 'hsl(var(--chart-3))',
  Other: 'hsl(var(--chart-4))',
};

const spendingCategories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Other"
];

const today = new Date().toISOString().split('T')[0];

export default function Home() {
  const [transactions, setTransactions] = React.useState<Transaction[]>(initialTransactions);
  const [budgetGoals, setBudgetGoals] = React.useState<{ [category: string]: number }>({});
  const {register, handleSubmit, reset} = useForm<{ date: string; description: string; amount: number; category: string }>();

  const calculateRemainingBudget = () => {
    let remaining = 0;
    for (const category in budgetGoals) {
      const spent = transactions.filter(t => t.category === category).reduce((sum, t) => sum + t.amount, 0);
      remaining += (budgetGoals[category] || 0) - spent;
    }
    return remaining;
  };

  const remainingBudget = calculateRemainingBudget();

  const onSubmit = (data: { date: string; description: string; amount: number; category: string }) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...data,
      amount: Number(data.amount),
    };

    setTransactions([...transactions, newTransaction]);
    reset();
    toast({
      title: "Transaction Added",
      description: `Successfully added transaction: ${newTransaction.description}`,
    });
  };

  const pieChartData = Object.entries(spendingCategories.reduce((acc, category) => {
    acc[category] = transactions.filter(t => t.category === category).reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {} as { [key: string]: number })).map(([name, value]) => ({name, value}));

  const renderPieChartLabel = ({
                                  cx,
                                  cy,
                                  midAngle,
                                  innerRadius,
                                  outerRadius,
                                  percent,
                                  index,
                                }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${pieChartData[index].name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-secondary p-4 flex flex-col md:flex-row">
      <div className="md:w-1/4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Overview</CardTitle>
            <CardDescription>Income, Expenses, and Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label>Remaining Budget:</Label>
              <div className="text-xl font-bold text-green-500">${remainingBudget.toFixed(2)}</div>
            </div>
            <Separator/>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Budget Goals</h3>
              {spendingCategories.map(category => (
                <div key={category} className="mb-2">
                  <Label htmlFor={`budget-${category}`}>{category}:</Label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      id={`budget-${category}`}
                      placeholder="Set budget"
                      className="mr-2"
                      onChange={(e) => {
                        setBudgetGoals({...budgetGoals, [category]: Number(e.target.value)});
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:w-1/2 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Input</CardTitle>
            <CardDescription>Add new transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input type="date" id="date" defaultValue={today} {...register("date", {required: true})}/>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input type="text" id="description" {...register("description", {required: true})}/>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input type="number" id="amount" step="0.01" {...register("amount", {required: true, valueAsNumber: true})}/>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category"/>
                  </SelectTrigger>
                  <SelectContent>
                    {spendingCategories.map(category => (
                      <SelectItem key={category} value={category} {...register("category")}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Add Transaction</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Spending Categories</CardTitle>
            <CardDescription>Visualize spending patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPieChartLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || "#8884d8"}/>
                  ))}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="md:w-1/4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View all transactions</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ScrollArea className="rounded-md border">
              <div className="p-4">
                {transactions.length === 0 ? (
                  <div className="text-center text-gray-500">No transactions yet.</div>
                ) : (
                  <ul>
                    {transactions.map(transaction => (
                      <li key={transaction.id} className="mb-2 p-2 rounded-md shadow-sm">
                        {transaction.date} - {transaction.description} - ${transaction.amount.toFixed(2)} ({transaction.category})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


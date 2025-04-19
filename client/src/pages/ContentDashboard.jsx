import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import ContentPlanning from '../components/content/ContentPlanning';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ContentDashboard = () => {
  const [activeTab, setActiveTab] = useState('planning');

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Content Dashboard</h1>
      
      <div className="w-full">
        <Tab.Group onChange={(index) => setActiveTab(index === 0 ? 'planning' : 'calendar')}>
          <Tab.List className="flex p-1 space-x-1 bg-blue-100 rounded-xl mb-6">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full py-2.5 text-sm font-medium text-blue-700 rounded-lg',
                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                  selected
                    ? 'bg-white shadow'
                    : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
                )
              }
            >
              Planning
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full py-2.5 text-sm font-medium text-blue-700 rounded-lg',
                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                  selected
                    ? 'bg-white shadow'
                    : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
                )
              }
            >
              Calendar
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <ContentPlanning />
            </Tab.Panel>
            <Tab.Panel>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-lg text-gray-500 text-center py-10">Calendar view coming soon!</p>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default ContentDashboard; 
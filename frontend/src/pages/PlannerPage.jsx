import React, { useEffect } from 'react';
import Header from '../components/Header.jsx';
import DepartmentManager from '../components/DepartmentManager.jsx';
import ScheduleGrid from '../components/ScheduleGrid.jsx';
import useStore from '../store/useStore.js';
import '../styles/PlannerPage.css';

function PlannerPage() {
  const fetchInitialData = useStore(state => state.fetchInitialData);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className="planner-page">
      <Header />
      <main className="planner-main">
        <section className="form-section">
          <DepartmentManager />
        </section>
        <section className="schedule-section">
          <ScheduleGrid />
        </section>
      </main>
    </div>
  );
}

export default PlannerPage;

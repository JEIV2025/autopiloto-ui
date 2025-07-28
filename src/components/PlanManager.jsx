import React, { useState, useEffect } from 'react';

const PlanManager = ({ waypoints, setWaypoints, progressIdx, setProgressIdx, onClose }) => {
  const [plans, setPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    try {
      const savedPlans = JSON.parse(localStorage.getItem('navigationPlans') || '{}');
      setPlans(savedPlans);
    } catch (error) {
      console.error('Error cargando planes:', error);
    }
  };

  const handleSaveCurrentPlan = () => {
    if (newPlanName.trim()) {
      try {
        const planData = {
          name: newPlanName,
          waypoints: waypoints,
          progressIdx: progressIdx,
          timestamp: new Date().toISOString(),
          description: `Plan guardado el ${new Date().toLocaleString('es-AR')}`,
          waypointCount: waypoints.filter(wp => wp.id !== 'Base').length
        };
        
        const updatedPlans = { ...plans, [newPlanName]: planData };
        localStorage.setItem('navigationPlans', JSON.stringify(updatedPlans));
        setPlans(updatedPlans);
        setShowNewPlanForm(false);
        setNewPlanName('');
        window.alert(`Plan "${newPlanName}" guardado exitosamente`);
      } catch (error) {
        console.error('Error guardando plan:', error);
        window.alert('Error al guardar el plan');
      }
    }
  };

  const handleLoadPlan = (planName) => {
    try {
      const plan = plans[planName];
      if (plan) {
        setWaypoints(plan.waypoints);
        setProgressIdx(plan.progressIdx || 0);
        setCurrentPlan(planName);
        window.alert(`Plan "${planName}" cargado exitosamente`);
      }
    } catch (error) {
      console.error('Error cargando plan:', error);
      window.alert('Error al cargar el plan');
    }
  };

  const handleDeletePlan = (planName) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el plan "${planName}"?`)) {
      try {
        const updatedPlans = { ...plans };
        delete updatedPlans[planName];
        localStorage.setItem('navigationPlans', JSON.stringify(updatedPlans));
        setPlans(updatedPlans);
        if (currentPlan === planName) {
          setCurrentPlan('');
        }
        setSelectedPlan(null);
        window.alert(`Plan "${planName}" eliminado`);
      } catch (error) {
        console.error('Error eliminando plan:', error);
        window.alert('Error al eliminar el plan');
      }
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-AR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold"> Gestor de Planes de Navegación</h2>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewPlanForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
               Guardar Plan Actual
            </button>
            {selectedPlan && (
              <>
                <button
                  onClick={() => handleLoadPlan(selectedPlan)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                   Cargar
                </button>
                <button
                  onClick={() => handleDeletePlan(selectedPlan)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                   Eliminar
                </button>
              </>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {Object.keys(plans).length} plan{Object.keys(plans).length !== 1 ? 'es' : ''} disponible{Object.keys(plans).length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {Object.keys(plans).length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold mb-2">No hay planes guardados</h3>
                <p className="text-gray-600">Guarda tu primer plan de navegación para comenzar</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(plans).map(([planName, planData]) => (
                  <div
                    key={planName}
                    onClick={() => setSelectedPlan(planName)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedPlan === planName
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${currentPlan === planName ? 'ring-2 ring-green-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{planName}</h3>
                      {currentPlan === planName && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">ACTUAL</span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span> Waypoints:</span>
                        <span className="font-semibold">{planData.waypointCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Creado:</span>
                        <span className="font-semibold">{formatDate(planData.timestamp)}</span>
                      </div>
                      {planData.description && (
                        <div className="text-xs text-gray-500 mt-2">
                          {planData.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formulario para nuevo plan */}
        {showNewPlanForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold mb-4">Guardar Plan Actual</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del plan:
                  </label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="Ej: Recorrido Costa Sur"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Waypoints:</strong> {waypoints.filter(wp => wp.id !== 'Base').length}</p>
                  <p><strong>Progreso actual:</strong> {progressIdx}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCurrentPlan}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex-1"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => { setShowNewPlanForm(false); setNewPlanName(''); }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanManager; 
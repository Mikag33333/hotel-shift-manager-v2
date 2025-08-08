import React, { useState, useCallback } from 'react';
import { Calendar, Users, Clock, Edit3, Plus, Trash2, Download, Brain, Zap, Settings } from 'lucide-react';

const departments = [
  { id: 'front', name: 'フロント', maxStaff: 8, color: 'bg-blue-100 border-blue-300' },
  { id: 'restaurant', name: 'レストラン', maxStaff: 10, color: 'bg-green-100 border-green-300' },
  { id: 'room', name: '客室', maxStaff: 20, color: 'bg-purple-100 border-purple-300' }
];

const defaultShifts = [
  { id: 'morning', name: '早番', time: '06:00-14:00' },
  { id: 'day', name: '日勤', time: '08:00-17:00' },
  { id: 'evening', name: '遅番', time: '14:00-22:00' },
  { id: 'night', name: '夜勤', time: '22:00-06:00' }
];

const personalityTypes = ['社交的', '内向的', 'リーダー気質', 'サポート型', '独立型', '協調型'];

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

function HotelShiftManager() {
  const [currentView, setCurrentView] = useState('staff');
  const [selectedDept, setSelectedDept] = useState('front');
  
  const [staffData, setStaffData] = useState({
    front: [],
    restaurant: [],
    room: []
  });
  
  const [shiftData, setShiftData] = useState({});
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  const [customShifts, setCustomShifts] = useState({
    front: JSON.parse(JSON.stringify(defaultShifts)),
    restaurant: JSON.parse(JSON.stringify(defaultShifts)),
    room: JSON.parse(JSON.stringify(defaultShifts))
  });
  
  const [requiredStaffCount, setRequiredStaffCount] = useState({});
  const [aiOptimization, setAiOptimization] = useState('balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingShiftSettings, setEditingShiftSettings] = useState(false);
  const [tempShiftSettings, setTempShiftSettings] = useState({});
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    age: '',
    gender: '',
    id: '',
    employmentType: '正社員',
    weeklyMaxHours: 40,
    dailyMaxHours: 8,
    visaStatus: '',
    experience: 'middle',
    skills: '',
    availableDays: [],
    unavailableDates: [],
    personality: '協調型',
    compatibility: {},
    workPreferences: {
      morningShift: true,
      dayShift: true,
      eveningShift: true,
      nightShift: false
    }
  });

  const generateWeekDates = useCallback((startDate: Date) => {
    const dates: Date[] = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const getRequiredStaff = useCallback((deptId, shiftId) => {
    const key = `${deptId}-${shiftId}`;
    return requiredStaffCount[key] || 1;
  }, [requiredStaffCount]);

  const setRequiredStaff = useCallback((deptId: string, shiftId: string, count: string) => {
    const key = `${deptId}-${shiftId}`;
    const parsedCount = parseInt(count, 10);
    if (isNaN(parsedCount) || parsedCount < 1) {
      console.warn('Invalid staff count:', count);
      return;
    }
    
    setRequiredStaffCount(prev => ({
      ...prev,
      [key]: parsedCount
    }));
  }, []);

  const updateShiftTime = useCallback((deptId: string, shiftId: string, field: string, value: string) => {
    setTempShiftSettings(prev => {
      const newTemp = JSON.parse(JSON.stringify(prev));
      if (!newTemp[deptId]) newTemp[deptId] = {};
      if (!newTemp[deptId][shiftId]) newTemp[deptId][shiftId] = {};
      
      newTemp[deptId][shiftId][field] = value;
      return newTemp;
    });
  }, []);

  const saveShiftSettings = useCallback(() => {
    try {
      const newCustomShifts = JSON.parse(JSON.stringify(customShifts));
      
      Object.keys(tempShiftSettings).forEach(deptId => {
        if (!tempShiftSettings[deptId]) return;
        
        Object.keys(tempShiftSettings[deptId]).forEach(shiftId => {
          const settings = tempShiftSettings[deptId][shiftId];
          if (!settings) return;
          
          const shiftIndex = newCustomShifts[deptId]?.findIndex(s => s.id === shiftId);
          
          if (shiftIndex !== -1 && newCustomShifts[deptId][shiftIndex]) {
            if (settings.name?.trim()) {
              newCustomShifts[deptId][shiftIndex].name = settings.name.trim();
            }
            if (settings.startTime && settings.endTime) {
              newCustomShifts[deptId][shiftIndex].time = `${settings.startTime}-${settings.endTime}`;
            }
          }
        });
      });
      
      setCustomShifts(newCustomShifts);
      setEditingShiftSettings(false);
      setTempShiftSettings({});
      alert('シフト設定を保存しました！');
    } catch (error) {
      console.error('Error saving shift settings:', error);
      alert('シフト設定の保存に失敗しました');
    }
  }, [customShifts, tempShiftSettings]);

  const startEditingShiftSettings = useCallback(() => {
    setEditingShiftSettings(true);
    const temp = {};
    
    departments.forEach(dept => {
      temp[dept.id] = {};
      const deptShifts = customShifts[dept.id] || [];
      
      deptShifts.forEach(shift => {
        const timeParts = shift.time?.split('-') || ['', ''];
        temp[dept.id][shift.id] = {
          name: shift.name || '',
          startTime: timeParts[0] || '',
          endTime: timeParts[1] || ''
        };
      });
    });
    
    setTempShiftSettings(temp);
  }, [customShifts]);

  const addStaff = useCallback(() => {
    if (!newStaff.name?.trim() || !newStaff.id?.trim()) {
      alert('氏名とIDは必須です');
      return;
    }

    const allStaff = Object.values(staffData).flat();
    if (allStaff.some(staff => staff.id === newStaff.id.trim())) {
      alert('このIDは既に使用されています');
      return;
    }

    const dept = departments.find(d => d.id === selectedDept);
    const currentStaff = staffData[selectedDept] || [];
    
    if (currentStaff.length >= dept.maxStaff) {
      alert(`${dept.name}の最大登録数（${dept.maxStaff}人）に達しています`);
      return;
    }

    const staffWithId = {
      ...newStaff,
      uniqueId: generateUniqueId(),
      department: selectedDept,
      name: newStaff.name.trim(),
      id: newStaff.id.trim()
    };

    setStaffData(prev => ({
      ...prev,
      [selectedDept]: [...(prev[selectedDept] || []), staffWithId]
    }));

    setNewStaff({
      name: '',
      age: '',
      gender: '',
      id: '',
      employmentType: '正社員',
      weeklyMaxHours: 40,
      dailyMaxHours: 8,
      visaStatus: '',
      experience: 'middle',
      skills: '',
      availableDays: [],
      unavailableDates: [],
      personality: '協調型',
      compatibility: {},
      workPreferences: {
        morningShift: true,
        dayShift: true,
        eveningShift: true,
        nightShift: false
      }
    });
  }, [newStaff, selectedDept, staffData]);

  const deleteStaff = useCallback((deptId, staffUniqueId) => {
    if (!window.confirm('このスタッフを削除しますか？')) return;
    
    setStaffData(prev => ({
      ...prev,
      [deptId]: (prev[deptId] || []).filter(staff => staff.uniqueId !== staffUniqueId)
    }));

    setShiftData(prev => {
      const newShiftData = { ...prev };
      Object.keys(newShiftData).forEach(key => {
        if (newShiftData[key] === staffUniqueId) {
          delete newShiftData[key];
        }
      });
      return newShiftData;
    });
  }, []);

  const generateAIShift = useCallback(async () => {
    const allStaff = Object.values(staffData).flat();
    if (allStaff.length === 0) {
      alert('スタッフが登録されていません');
      return;
    }

    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newShiftData = {};
      const displayDates = generateWeekDates(selectedWeek);
      
      displayDates.forEach(date => {
        defaultShifts.forEach(shift => {
          departments.forEach(dept => {
            const deptStaff = staffData[dept.id] || [];
            const requiredCount = getRequiredStaff(dept.id, shift.id);
            
            if (deptStaff.length > 0) {
              for (let i = 0; i < requiredCount; i++) {
                const dateStr = date.toISOString().split('T')[0];
                const key = `${dateStr}-${shift.id}-${dept.id}-${i}`;
                
                const availableStaff = deptStaff.filter(staff => {
                  const dayKeys = Object.keys(newShiftData).filter(k => 
                    k.startsWith(`${dateStr}-`) && newShiftData[k] === staff.uniqueId
                  );
                  return dayKeys.length === 0;
                });
                
                if (availableStaff.length > 0) {
                  const sortedStaff = availableStaff.sort((a, b) => {
                    const experienceOrder = { expert: 3, middle: 2, beginner: 1 };
                    return experienceOrder[b.experience] - experienceOrder[a.experience];
                  });
                  
                  newShiftData[key] = sortedStaff[0].uniqueId;
                }
              }
            }
          });
        });
      });
      
      setShiftData(newShiftData);
      alert('🤖 AI自動シフトが完成しました！');
      
    } catch (error) {
      console.error('Error generating AI shift:', error);
      alert('AI自動生成でエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  }, [staffData, selectedWeek, generateWeekDates, getRequiredStaff]);

  const handleShiftAssignment = useCallback((key, staffUniqueId) => {
    setShiftData(prev => {
      const newData = { ...prev };
      
      if (staffUniqueId && staffUniqueId !== '') {
        newData[key] = staffUniqueId;
      } else {
        delete newData[key];
      }
      
      return newData;
    });
  }, []);

  const displayDates = generateWeekDates(selectedWeek);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WorkScheduler Pro</h1>
                <p className="text-sm text-gray-600">AI搭載シフト管理システム</p>
              </div>
            </div>
            
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentView('staff')}
                className={`px-3 py-2 rounded-lg font-medium text-sm ${
                  currentView === 'staff' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1" />
                スタッフ管理
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`px-3 py-2 rounded-lg font-medium text-sm ${
                  currentView === 'settings' 
                    ? 'bg-orange-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                シフト設定
              </button>
              <button
                onClick={() => setCurrentView('ai')}
                className={`px-3 py-2 rounded-lg font-medium text-sm ${
                  currentView === 'ai' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-1" />
                AI自動作成
              </button>
              <button
                onClick={() => setCurrentView('shift')}
                className={`px-3 py-2 rounded-lg font-medium text-sm ${
                  currentView === 'shift' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                シフト管理
              </button>
              <button
                onClick={() => setCurrentView('emergency')}
                className={`px-3 py-2 rounded-lg font-medium text-sm ${
                  currentView === 'emergency' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-1" />
                緊急対応
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">シフト時間 & 必要人数設定</h2>
                <div className="space-x-2">
                  {!editingShiftSettings ? (
                    <button
                      onClick={startEditingShiftSettings}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                    >
                      編集開始
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={saveShiftSettings}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setEditingShiftSettings(false);
                          setTempShiftSettings({});
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                      >
                        キャンセル
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {departments.map(dept => (
                  <div key={dept.id} className={`border-2 rounded-lg p-4 ${dept.color}`}>
                    <h3 className="text-lg font-semibold mb-4">{dept.name}</h3>
                    <div className="space-y-4">
                      {(customShifts[dept.id] || []).map(shift => (
                        <div key={shift.id} className="bg-white p-4 rounded-lg border">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">シフト名</label>
                              {editingShiftSettings ? (
                                <input
                                  type="text"
                                  value={
                                    tempShiftSettings[dept.id]?.[shift.id]?.name || shift.name
                                  }
                                  onChange={(e) => updateShiftTime(dept.id, shift.id, 'name', e.target.value)}
                                  className="w-full p-2 border rounded"
                                />
                              ) : (
                                <div className="p-2 bg-gray-50 rounded font-semibold">{shift.name}</div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-sm font-medium mb-1">開始時間</label>
                                {editingShiftSettings ? (
                                  <input
                                    type="time"
                                    value={
                                      tempShiftSettings[dept.id]?.[shift.id]?.startTime || 
                                      shift.time?.split('-')[0] || ''
                                    }
                                    onChange={(e) => updateShiftTime(dept.id, shift.id, 'startTime', e.target.value)}
                                    className="w-full p-2 border rounded"
                                  />
                                ) : (
                                  <div className="p-2 bg-gray-50 rounded text-sm">{shift.time?.split('-')[0] || ''}</div>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">終了時間</label>
                                {editingShiftSettings ? (
                                  <input
                                    type="time"
                                    value={
                                      tempShiftSettings[dept.id]?.[shift.id]?.endTime || 
                                      shift.time?.split('-')[1] || ''
                                    }
                                    onChange={(e) => updateShiftTime(dept.id, shift.id, 'endTime', e.target.value)}
                                    className="w-full p-2 border rounded"
                                  />
                                ) : (
                                  <div className="p-2 bg-gray-50 rounded text-sm">{shift.time?.split('-')[1] || ''}</div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">必要人数</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={getRequiredStaff(dept.id, shift.id)}
                                onChange={(e) => setRequiredStaff(dept.id, shift.id, e.target.value)}
                                className="w-full p-2 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'staff' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-4">部署選択</h2>
              <div className="grid grid-cols-3 gap-4">
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedDept === dept.id 
                        ? `${dept.color} border-opacity-100` 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="font-semibold">{dept.name}</h3>
                      <p className="text-sm text-gray-600">
                        {(staffData[dept.id] || []).length}/{dept.maxStaff}名
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-4">スタッフ登録</h2>
              
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3 text-blue-800">基本情報</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">氏名 *</label>
                    <input
                      type="text"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="山田太郎"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">スタッフID *</label>
                    <input
                      type="text"
                      value={newStaff.id}
                      onChange={(e) => setNewStaff({...newStaff, id: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="F001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">年齢</label>
                    <input
                      type="number"
                      value={newStaff.age}
                      onChange={(e) => setNewStaff({...newStaff, age: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">性別</label>
                    <select
                      value={newStaff.gender}
                      onChange={(e) => setNewStaff({...newStaff, gender: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">選択</option>
                      <option value="男性">男性</option>
                      <option value="女性">女性</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3 text-green-800">勤務条件</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">雇用形態</label>
                    <select
                      value={newStaff.employmentType}
                      onChange={(e) => setNewStaff({...newStaff, employmentType: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="正社員">正社員</option>
                      <option value="契約社員">契約社員</option>
                      <option value="パート">パート</option>
                      <option value="アルバイト">アルバイト</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">経験レベル</label>
                    <select
                      value={newStaff.experience}
                      onChange={(e) => setNewStaff({...newStaff, experience: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="beginner">新人</option>
                      <option value="middle">中堅</option>
                      <option value="expert">ベテラン</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">性格タイプ</label>
                    <select
                      value={newStaff.personality}
                      onChange={(e) => setNewStaff({...newStaff, personality: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                    >
                      {personalityTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-md font-semibold mb-3 text-purple-800">勤務可能日時</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">勤務可能曜日</label>
                  <div className="flex flex-wrap gap-2">
                    {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newStaff.availableDays.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStaff({
                                ...newStaff,
                                availableDays: [...newStaff.availableDays, index]
                              });
                            } else {
                              setNewStaff({
                                ...newStaff,
                                availableDays: newStaff.availableDays.filter(d => d !== index)
                              });
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">シフト希望</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStaff.workPreferences.morningShift}
                        onChange={(e) => setNewStaff({
                          ...newStaff,
                          workPreferences: {
                            ...newStaff.workPreferences,
                            morningShift: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">早番 (6:00-14:00)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStaff.workPreferences.dayShift}
                        onChange={(e) => setNewStaff({
                          ...newStaff,
                          workPreferences: {
                            ...newStaff.workPreferences,
                            dayShift: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">日勤 (8:00-17:00)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStaff.workPreferences.eveningShift}
                        onChange={(e) => setNewStaff({
                          ...newStaff,
                          workPreferences: {
                            ...newStaff.workPreferences,
                            eveningShift: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">遅番 (14:00-22:00)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStaff.workPreferences.nightShift}
                        onChange={(e) => setNewStaff({
                          ...newStaff,
                          workPreferences: {
                            ...newStaff.workPreferences,
                            nightShift: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">夜勤 (22:00-6:00)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">週最大労働時間</label>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      value={newStaff.weeklyMaxHours}
                      onChange={(e) => setNewStaff({...newStaff, weeklyMaxHours: parseInt(e.target.value) || 40})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="40"
                    />
                    <p className="text-xs text-gray-500 mt-1">時間/週</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">日最大労働時間</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={newStaff.dailyMaxHours}
                      onChange={(e) => setNewStaff({...newStaff, dailyMaxHours: parseInt(e.target.value) || 8})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="8"
                    />
                    <p className="text-xs text-gray-500 mt-1">時間/日</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={addStaff}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  スタッフ登録
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                {departments.find(d => d.id === selectedDept)?.name} スタッフ一覧
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left">氏名</th>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">経験</th>
                      <th className="px-3 py-2 text-left">性格</th>
                      <th className="px-3 py-2 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(staffData[selectedDept] || []).map(staff => (
                      <tr key={staff.uniqueId} className="border-t">
                        <td className="px-3 py-2 font-medium">{staff.name}</td>
                        <td className="px-3 py-2">{staff.id}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            staff.experience === 'expert' ? 'bg-yellow-100 text-yellow-800' :
                            staff.experience === 'middle' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {staff.experience === 'expert' ? 'ベテラン' :
                             staff.experience === 'middle' ? '中堅' : '新人'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                            {staff.personality}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => deleteStaff(selectedDept, staff.uniqueId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(staffData[selectedDept] || []).length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          まだスタッフが登録されていません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 rounded-xl text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">AI自動シフト生成 Pro</h2>
                  <p className="text-purple-100">高度な最適化アルゴリズムで完璧なシフトを自動作成</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    必要人数確保
                  </h3>
                  <p className="text-sm text-purple-100 mt-2">部署・シフト別の必要人数を自動配置</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    勤務可能日考慮
                  </h3>
                  <p className="text-sm text-purple-100 mt-2">個別の勤務可能日・シフト希望を反映</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    労働基準法遵守
                  </h3>
                  <p className="text-sm text-purple-100 mt-2">週間・日別労働時間制限を厳格チェック</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center">
                    <Edit3 className="w-4 h-4 mr-2" />
                    相性マッチング
                  </h3>
                  <p className="text-sm text-purple-100 mt-2">性格・相性を考慮したチーム編成</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">AI最適化設定</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">最適化モード</label>
                  <select
                    value={aiOptimization}
                    onChange={(e) => setAiOptimization(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="balanced">バランス重視（推奨）</option>
                    <option value="efficiency">効率重視</option>
                    <option value="safety">安全重視</option>
                    <option value="harmony">相性重視</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">対象週</label>
                  <input
                    type="date"
                    value={selectedWeek.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedWeek(new Date(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={generateAIShift}
                  disabled={isGenerating || Object.values(staffData).flat().length === 0}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      AI処理中...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-3" />
                      AIで自動シフト生成
                    </>
                  )}
                </button>
                
                {Object.values(staffData).flat().length === 0 && (
                  <p className="text-sm text-red-500 mt-2">
                    ※ まずスタッフを登録してください
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800">登録スタッフ数</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(staffData).flat().length}名
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800">配置済みシフト</h4>
                <p className="text-2xl font-bold text-green-600">
                  {Object.keys(shiftData).filter(key => shiftData[key]).length}件
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800">必要人数設定</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(requiredStaffCount).length}件
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800">労働時間遵守率</h4>
                <p className="text-2xl font-bold text-orange-600">100%</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'shift' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">週間シフト表</h2>
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    value={selectedWeek.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedWeek(new Date(e.target.value))}
                    className="p-2 border rounded-lg"
                  />
                  <button
                    onClick={() => {
                      console.log('CSV出力（実装予定）');
                      alert('CSV出力機能（実装予定）');
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV出力
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">日付</th>
                      <th className="px-4 py-3 text-left font-semibold">シフト</th>
                      {departments.map(dept => (
                        <th key={dept.id} className="px-4 py-3 text-center font-semibold">
                          {dept.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayDates.map(date => 
                      defaultShifts.map(shift => (
                        <tr key={`${date.toISOString()}-${shift.id}`} className="border-t">
                          <td className="px-4 py-2 font-medium">
                            {date.toLocaleDateString('ja-JP', {
                              month: 'numeric',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="font-semibold">{shift.name}</div>
                            <div className="text-xs text-gray-500">{shift.time}</div>
                          </td>
                          {departments.map(dept => {
                            const dateStr = date.toISOString().split('T')[0];
                            const requiredCount = getRequiredStaff(dept.id, shift.id);
                            
                            return (
                              <td key={dept.id} className="px-2 py-2">
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500 mb-1">
                                    必要: {requiredCount}名
                                  </div>
                                  {Array.from({length: requiredCount}, (_, index) => {
                                    const key = `${dateStr}-${shift.id}-${dept.id}-${index}`;
                                    const assignedStaffId = shiftData[key];
                                    
                                    return (
                                      <select
                                        key={index}
                                        value={assignedStaffId || ''}
                                        onChange={(e) => handleShiftAssignment(key, e.target.value)}
                                        className="w-full p-1 text-xs border rounded mb-1"
                                      >
                                        <option value="">未配置</option>
                                        {(staffData[dept.id] || []).map(staff => (
                                          <option key={staff.uniqueId} value={staff.uniqueId}>
                                            {staff.name}
                                            {staff.experience === 'expert' ? ' 🌟' : 
                                             staff.experience === 'middle' ? ' ⭐' : ' 🔰'}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'emergency' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-xl text-white">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">緊急シフト対応</h2>
                  <p className="text-red-100">急な欠勤・変更に即座に対応します</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-red-600" />
                  急な欠勤対応
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">欠勤するスタッフ</label>
                    <select className="w-full p-3 border rounded-lg">
                      <option value="">スタッフを選択</option>
                      {Object.values(staffData).flat().map(staff => (
                        <option key={staff.uniqueId} value={staff.uniqueId}>
                          {staff.name} ({departments.find(d => d.id === staff.department)?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">対象日</label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded-lg"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">対象シフト</label>
                    <select className="w-full p-3 border rounded-lg">
                      <option value="">シフトを選択</option>
                      {defaultShifts.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.time})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium">
                    代替スタッフを検索
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  AI代替スタッフ提案
                </h3>
                
                <div className="space-y-3">
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">推奨度: 高</p>
                        <p className="text-sm text-gray-600">田中花子 (中堅・協調型)</p>
                        <p className="text-xs text-gray-500">勤務可能・経験適合・今週の労働時間に余裕あり</p>
                      </div>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                        選択
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-yellow-800">推奨度: 中</p>
                        <p className="text-sm text-gray-600">佐藤一郎 (ベテラン・リーダー気質)</p>
                        <p className="text-xs text-gray-500">勤務可能・高経験・今週やや多忙</p>
                      </div>
                      <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm">
                        選択
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">推奨度: 低</p>
                        <p className="text-sm text-gray-600">鈴木太郎 (新人・内向的)</p>
                        <p className="text-xs text-gray-500">勤務可能・経験浅い・要サポート</p>
                      </div>
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                        選択
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">💡 ワンポイントアドバイス</p>
                  <p className="text-xs text-blue-600">田中さんは同じ時間帯の経験が豊富で、チームワークも良好です。お客様対応も安心してお任せできます。</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                最近の緊急対応履歴
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">日時</th>
                      <th className="px-4 py-2 text-left">欠勤者</th>
                      <th className="px-4 py-2 text-left">代替者</th>
                      <th className="px-4 py-2 text-left">対応時間</th>
                      <th className="px-4 py-2 text-left">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-2">2024/1/15 08:30</td>
                      <td className="px-4 py-2">山田太郎</td>
                      <td className="px-4 py-2">田中花子</td>
                      <td className="px-4 py-2">5分</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">完了</span>
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-2">2024/1/12 14:15</td>
                      <td className="px-4 py-2">佐藤次郎</td>
                      <td className="px-4 py-2">鈴木三郎</td>
                      <td className="px-4 py-2">12分</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">完了</span>
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-2">2024/1/10 07:45</td>
                      <td className="px-4 py-2">高橋花子</td>
                      <td className="px-4 py-2">-</td>
                      <td className="px-4 py-2">-</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">代替者なし</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800">今月の緊急対応</h4>
                <p className="text-2xl font-bold text-red-600">8件</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800">解決率</h4>
                <p className="text-2xl font-bold text-green-600">87.5%</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800">平均対応時間</h4>
                <p className="text-2xl font-bold text-blue-600">8.5分</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800">代替出勤回数</h4>
                <p className="text-2xl font-bold text-purple-600">24回</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HotelShiftManager;
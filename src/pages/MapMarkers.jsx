import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Plus, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import L from 'leaflet';

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 自定义用户位置图标（蓝色）
const userLocationIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
  className: 'user-location-icon'
});

// 自定义标注点图标（红色SVG）
const poiIcon = L.divIcon({
  html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C8.37 0 3 5.37 3 12c0 9 12 30 12 30s12-21 12-30c0-6.63-5.37-12-12-12z" fill="#EF4444"/>
    <circle cx="15" cy="12" r="5" fill="white"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
  className: 'poi-icon'
});

const defaultMarkers = [
  { id: 1, name: '上海市中心', lat: 31.2304, lng: 121.4737, description: '人民广场' },
  { id: 2, name: '上海浦东1', lat: 31.2380, lng: 121.4850, description: '浦东新区' },
  { id: 3, name: '上海浦东2', lat: 31.2450, lng: 121.4920, description: '陆家嘴' },
  { id: 4, name: '上海虹口', lat: 31.2600, lng: 121.5050, description: '虹口区' },
  { id: 5, name: '上海静安', lat: 31.2250, lng: 121.4600, description: '静安寺' },
  { id: 6, name: '上海徐汇1', lat: 31.1950, lng: 121.4500, description: '徐家汇' },
  { id: 7, name: '上海徐汇2', lat: 31.1850, lng: 121.4450, description: '衡山路' },
  { id: 8, name: '上海闵行', lat: 31.1750, lng: 121.5150, description: '闵行区' },
  { id: 9, name: '上海浦西', lat: 31.2150, lng: 121.4400, description: '黄浦江西' },
  { id: 10, name: '上海杨浦', lat: 31.2750, lng: 121.5200, description: '杨浦区' },
  { id: 11, name: '北京', lat: 39.9042, lng: 116.4074, description: '中国首都' },
];

// 计算两点距离（km）
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 地球半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 聚类算法
const clusterMarkers = (markersToCluster, clusterRadius) => {
  console.log('%c【clusterMarkers 函数执行】', 'color: green; font-weight: bold');
  console.log('📍 输入标注点数:', markersToCluster.length);
  console.log('📏 聚类半径:', clusterRadius, 'km');
  
  const clusters = [];
  const visited = new Set();

  markersToCluster.forEach((marker, idx) => {
    if (visited.has(idx)) return;

    const cluster = [marker];
    visited.add(idx);

    markersToCluster.forEach((otherMarker, otherIdx) => {
      if (!visited.has(otherIdx)) {
        const distance = calculateDistance(marker.lat, marker.lng, otherMarker.lat, otherMarker.lng);
        if (distance < clusterRadius) {
          cluster.push(otherMarker);
          visited.add(otherIdx);
        }
      }
    });

    clusters.push({
      count: cluster.length,
      lat: cluster.reduce((sum, m) => sum + m.lat, 0) / cluster.length,
      lng: cluster.reduce((sum, m) => sum + m.lng, 0) / cluster.length,
      markers: cluster
    });
  });

  console.log('✅ 聚类完成，共', clusters.length, '个聚类');
  return clusters;
};

// 内部组件：用于获取地图实例
function MapContent({ userLocation, clusters, visibleMarkers, zoomLevel, setZoomLevel, mapRef, setUserLocation }) {
  const map = useMap();
  const geolocationAttempted = React.useRef(false);
  
  React.useEffect(() => {
    console.log('🗺️ useMap hook 被调用，地图实例:', map);
    mapRef.current = map;
    console.log('✅ mapRef.current 已通过 useMap 设置');
    
    // 监听缩放事件
    const handleZoom = () => {
      const newZoom = map.getZoom();
      console.log('%c【缩放事件】', 'color: purple; font-weight: bold');
      console.log('🔍 缩放级别变更:', newZoom);
      setZoomLevel(newZoom);
    };
    
    map.on('zoomend', handleZoom);
    console.log('✅ 缩放事件监听已注册');
    return () => {
      map.off('zoomend', handleZoom);
      console.log('❌ 缩放事件监听已移除');
    };
  }, [map, mapRef, setZoomLevel]);
  
  // 地图初始化完成后，获取用户位置（仅一次）
  React.useEffect(() => {
    if (map && !userLocation && !geolocationAttempted.current) {
      geolocationAttempted.current = true;
      console.log('🗺️ 地图已初始化，开始获取用户位置...');
      
      if (navigator.geolocation) {
        const startTime = Date.now();
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.log('%c✅ 位置获取成功！', 'color: green; font-weight: bold; font-size: 12px');
            console.log('⏱️ 耗时:', duration, 'ms (', (duration / 1000).toFixed(2), '秒)');
            console.log('📍 纬度:', position.coords.latitude);
            console.log('📍 经度:', position.coords.longitude);
            console.log('📍 精度:', position.coords.accuracy, '米');
            
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            console.log('💾 userLocation 已更新');
          },
          (error) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.log('%c❌ 位置获取失败', 'color: red; font-weight: bold; font-size: 12px');
            console.log('⏱️ 耗时:', duration, 'ms');
            console.log('错误代码:', error.code);
            console.log('错误信息:', error.message);
          }
        );
      }
    }
  }, [map, userLocation, setUserLocation]);
  
  // 地图已有位置信息时，执行缩放
  React.useEffect(() => {
    if (map && userLocation) {
      console.log('🗺️ 地图已初始化，执行自动缩放到用户位置');
      setTimeout(() => {
        const bounds = L.latLngBounds(
          L.latLng(userLocation.lat - 0.045, userLocation.lng - 0.045),
          L.latLng(userLocation.lat + 0.045, userLocation.lng + 0.045)
        );
        map.fitBounds(bounds);
        console.log('✅ 自动缩放完成');
      }, 100);
    }
  }, [map, userLocation]);

  return (
    <>
      <TileLayer
        url="https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
        attribution='&copy; 高德地图'
        maxZoom={19}
      />
      
      {/* 用户位置 - 蓝色图标 */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
          <Popup>
            <div className="text-sm font-bold">我的位置</div>
          </Popup>
        </Marker>
      )}

      {/* 聚类标记 */}
      {clusters.map((cluster, idx) => {
        const clusterIcon = L.divIcon({
          html: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#3B82F6" opacity="0.9" stroke="white" stroke-width="2"/>
            <text x="20" y="24" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${cluster.count}</text>
          </svg>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
          className: 'cluster-icon'
        });
        
        return cluster.count > 1 ? (
          <Marker key={`cluster-${idx}`} position={[cluster.lat, cluster.lng]} icon={clusterIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold text-slate-900">聚合点 ({cluster.count}个)</div>
                <div className="text-slate-600 text-xs mt-2 space-y-1">
                  {cluster.markers.map(m => (
                    <div key={m.id}>{m.name}</div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ) : (
          <Marker key={`marker-${cluster.markers[0].id}`} position={[cluster.lat, cluster.lng]} icon={poiIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold text-slate-900">{cluster.markers[0].name}</div>
                <div className="text-slate-600 text-xs">
                  {cluster.markers[0].lat.toFixed(4)}, {cluster.markers[0].lng.toFixed(4)}
                </div>
                <div className="text-slate-600 text-xs mt-1">{cluster.markers[0].description}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function MapMarkersPage() {
  const pageLoadTime = React.useRef(Date.now());
  
  React.useEffect(() => {
    const now = Date.now();
    console.log('%c========== 页面加载开始 ==========', 'color: blue; font-weight: bold; font-size: 14px');
    console.log('📄 MapMarkersPage 组件挂载，时间:', new Date().toLocaleTimeString());
    
    return () => {
      const duration = Date.now() - pageLoadTime.current;
      console.log('%c========== 页面卸载 ==========', 'color: red; font-weight: bold; font-size: 14px');
      console.log('⏱️ 页面存活时间:', duration, 'ms');
    };
  }, []);
  
  const [markers, setMarkers] = useState(defaultMarkers);
  const [newMarker, setNewMarker] = useState({ name: '', lat: '', lng: '', description: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [clusters, setClusters] = useState([]);
  const [visibleMarkers, setVisibleMarkers] = useState(defaultMarkers);
  const mapRef = React.useRef(null);



  React.useEffect(() => {
    // 显示所有标注点（不做距离过滤）
    console.log('%c[useEffect] 更新标注点列表', 'color: cyan');
    console.log('📍 markers 数量:', markers.length);
    setVisibleMarkers(markers);
  }, [markers]);

  React.useEffect(() => {
    // 根据缩放级别动态聚类
    const clusterRadius = Math.max(0.2, 250 / Math.pow(2, zoomLevel - 3)); // km
    console.log('%c【聚类计算】', 'color: orange; font-weight: bold');
    console.log('🔍 当前缩放级别:', zoomLevel);
    console.log('📏 聚类半径:', clusterRadius.toFixed(2), 'km');
    
    const clustered = clusterMarkers(visibleMarkers, clusterRadius);
    console.log('📊 聚类结果:', clustered.length, '个聚类');
    clustered.forEach((cluster, idx) => {
      console.log(`  聚类 ${idx + 1}: ${cluster.count} 个点, 位置: (${cluster.lat.toFixed(4)}, ${cluster.lng.toFixed(4)})`);
    });
    
    setClusters(clustered);
  }, [visibleMarkers, zoomLevel]);

  const performRefresh = React.useCallback(() => {
    console.log('%c========== 刷新按钮被点击 ==========', 'color: purple; font-weight: bold; font-size: 12px');
    console.log('⏰ 点击时间:', new Date().toLocaleTimeString());
    
    // 重新获取用户位置
    if (navigator.geolocation) {
      console.log('🔄 重新获取用户位置...');
      const startTime = Date.now();
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          console.log('%c✅ 重新获取位置成功！', 'color: green; font-weight: bold; font-size: 12px');
          console.log('⏱️ 耗时:', duration, 'ms');
          
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          console.log('💾 userLocation 已更新');
          
          // 位置更新后，地图会自动缩放（通过 MapContent 中的 useEffect）
        },
        (error) => {
          console.log('%c❌ 重新获取位置失败', 'color: red; font-weight: bold; font-size: 12px');
          console.log('错误信息:', error.message);
        }
      );
    }
  }, []);



  const handleAddMarkerClick = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      setNewMarker({ 
        name: '', 
        lat: center.lat.toFixed(4), 
        lng: center.lng.toFixed(4), 
        description: '' 
      });
    }
  };

  const addMarker = () => {
    if (newMarker.name && newMarker.lat && newMarker.lng) {
      setMarkers([
        ...markers,
        {
          id: Date.now(),
          name: newMarker.name,
          lat: parseFloat(newMarker.lat),
          lng: parseFloat(newMarker.lng),
          description: newMarker.description || '新标注点'
        }
      ]);
      setNewMarker({ name: '', lat: '', lng: '', description: '' });
    }
  };

  const deleteMarker = (id) => {
    setMarkers(markers.filter(m => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-blue-600" />
                  地图多标注点验证
                </CardTitle>
                <CardDescription className="mt-2 text-slate-600">
                  使用 React-Leaflet 在地图上显示多个标注点
                </CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                {visibleMarkers.length}/{markers.length} 个标注点
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 font-semibold">验证说明</AlertTitle>
              <AlertDescription className="text-green-700">
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>地图使用 OpenStreetMap 作为底图</li>
                  <li>支持添加、删除、查看标注点</li>
                  <li>每个标注点包含位置名称、经纬度和描述</li>
                  <li>点击标注点可以查看详细信息</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[900px]">
              {/* 左侧：标注点管理 */}
              <Card className="lg:col-span-1 border-2 h-full">
                <CardHeader>
                  <CardTitle className="text-lg">标注点管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">位置名称</label>
                    <Input
                      placeholder="例如：上海"
                      value={newMarker.name}
                      onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">纬度</label>
                      <Input
                        placeholder="31.2304"
                        value={newMarker.lat}
                        onChange={(e) => setNewMarker({ ...newMarker, lat: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">经度</label>
                      <Input
                        placeholder="121.4737"
                        value={newMarker.lng}
                        onChange={(e) => setNewMarker({ ...newMarker, lng: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">描述</label>
                    <Input
                      placeholder="描述信息"
                      value={newMarker.description}
                      onChange={(e) => setNewMarker({ ...newMarker, description: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleAddMarkerClick} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    添加标注点
                  </Button>

                  <Button onClick={addMarker} className="w-full bg-green-600 hover:bg-green-700" disabled={!newMarker.name}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    确认添加
                  </Button>

                  <div className="border-t pt-4 space-y-2 max-h-96 overflow-y-auto">
                    {visibleMarkers.map(marker => (
                      <div key={marker.id} className="border rounded p-2 text-sm">
                        <div className="font-medium text-slate-900">{marker.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">{marker.description}</div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full mt-2"
                          onClick={() => deleteMarker(marker.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          删除
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 右侧：地图 */}
              <div className="lg:col-span-3 h-full">
                <Card className="border-2 h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">地图展示</CardTitle>
                      {userLocation && (
                        <p className="text-xs text-slate-500 mt-1">
                          我的位置: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={performRefresh}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      刷新
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 overflow-hidden rounded-b-lg flex-1" style={{ minHeight: '800px' }}>
                    <MapContainer
                      center={userLocation ? [userLocation.lat, userLocation.lng] : [31.2304, 121.4737]}
                      zoom={4}
                      style={{ width: '100%', height: '100%' }}
                      className="w-full h-full"
                    >
                      <MapContent 
                        userLocation={userLocation}
                        setUserLocation={setUserLocation}
                        clusters={clusters}
                        visibleMarkers={visibleMarkers}
                        zoomLevel={zoomLevel}
                        setZoomLevel={setZoomLevel}
                        mapRef={mapRef}
                      />
                    </MapContainer>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertTitle className="text-blue-800 font-semibold">验证结果</AlertTitle>
              <AlertDescription className="text-blue-700">
                ✅ <strong>React-Leaflet 在 Base44 运行正常</strong>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>地图成功渲染</li>
                  <li>支持多个标注点同时显示</li>
                  <li>标注点弹窗信息完整</li>
                  <li>动态添加/删除标注点正常工作</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
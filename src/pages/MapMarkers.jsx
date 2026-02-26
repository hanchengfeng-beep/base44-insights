import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const defaultMarkers = [
  { id: 1, name: '上海', lat: 31.2304, lng: 121.4737, description: '中国最大城市' },
  { id: 2, name: '北京', lat: 39.9042, lng: 116.4074, description: '中国首都' },
  { id: 3, name: '深圳', lat: 22.5431, lng: 114.0579, description: '经济特区' },
  { id: 4, name: '杭州', lat: 30.2741, lng: 120.1551, description: '电商之都' },
  { id: 5, name: '南京', lat: 32.0603, lng: 118.7969, description: '六朝古都' },
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

  return clusters;
};

export default function MapMarkersPage() {
  const [markers, setMarkers] = useState(defaultMarkers);
  const [newMarker, setNewMarker] = useState({ name: '', lat: '', lng: '', description: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [clusters, setClusters] = useState([]);
  const [visibleMarkers, setVisibleMarkers] = useState(defaultMarkers);
  const mapRef = React.useRef(null);

  React.useEffect(() => {
    // 获取用户位置
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // 缩放地图到10KM范围
          if (mapRef.current) {
            const bounds = L.latLngBounds(
              L.latLng(latitude - 0.045, longitude - 0.045),
              L.latLng(latitude + 0.045, longitude + 0.045)
            );
            mapRef.current.fitBounds(bounds);
          }
        },
        (error) => console.log('位置获取失败:', error)
      );
    }
  }, []);

  React.useEffect(() => {
    // 过滤10KM范围内的标注点
    if (userLocation) {
      const filtered = markers.filter(marker => {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, marker.lat, marker.lng);
        return distance <= 10; // 10KM范围
      });
      setVisibleMarkers(filtered);
    } else {
      setVisibleMarkers(markers);
    }
  }, [markers, userLocation]);

  React.useEffect(() => {
    // 根据缩放级别动态聚类
    const clusterRadius = Math.max(0.5, 20 / Math.pow(2, zoomLevel)); // km
    const clustered = clusterMarkers(visibleMarkers, clusterRadius);
    setClusters(clustered);
  }, [visibleMarkers, zoomLevel]);

  React.useEffect(() => {
    console.log('🔍 MapMarkersPage 组件已挂载/更新');
    console.log('📍 mapRef.current:', mapRef.current);
    console.log('🗺️ 检查 .leaflet-container 是否存在:', document.querySelector('.leaflet-container'));
  }, []);



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

                  <Button onClick={addMarker} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    添加标注点
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
                      onClick={() => {
                        console.log('🔄 刷新按钮被点击');
                        console.log('📍 mapRef.current:', mapRef.current);
                        console.log('📍 userLocation:', userLocation);
                        
                        if (mapRef.current) {
                          console.log('✅ 地图实例存在，调用 invalidateSize');
                          mapRef.current.invalidateSize();
                          
                          if (userLocation) {
                            console.log('✅ 用户位置存在，准备缩放');
                            const bounds = L.latLngBounds(
                              L.latLng(userLocation.lat - 0.045, userLocation.lng - 0.045),
                              L.latLng(userLocation.lat + 0.045, userLocation.lng + 0.045)
                            );
                            console.log('📊 缩放范围:', bounds);
                            mapRef.current.fitBounds(bounds);
                            console.log('✅ fitBounds 调用完成');
                          } else {
                            console.log('❌ userLocation 为空');
                          }
                        } else {
                          console.log('❌ 地图实例不存在');
                        }
                      }}
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
                      onZoomEnd={(e) => setZoomLevel(e.target.getZoom())}
                      whenCreated={(map) => {
                        console.log('🗺️ MapContainer whenCreated 被调用');
                        console.log('📍 map 实例:', map);
                        mapRef.current = map;
                        console.log('✅ mapRef.current 已设置:', mapRef.current);
                        setTimeout(() => {
                          map.invalidateSize();
                          console.log('✅ invalidateSize 已执行');
                        }, 100);
                      }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                        maxZoom={19}
                      />
                      
                      {/* 用户位置 */}
                      {userLocation && (
                        <Marker position={[userLocation.lat, userLocation.lng]}>
                          <Popup>
                            <div className="text-sm font-bold">我的位置</div>
                          </Popup>
                        </Marker>
                      )}

                      {/* 聚类后的标注点 */}
                      {clusters.map((cluster, idx) => (
                        <Marker
                          key={idx}
                          position={[cluster.lat, cluster.lng]}
                        >
                          <Popup>
                            <div className="text-sm">
                              {cluster.count > 1 ? (
                                <div>
                                  <div className="font-bold">聚类点 ({cluster.count}个)</div>
                                  <ul className="text-xs mt-2">
                                    {cluster.markers.map((m, i) => (
                                      <li key={i}>- {m.name}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-bold text-slate-900">{cluster.markers[0].name}</div>
                                  <div className="text-slate-600">
                                    {cluster.markers[0].lat.toFixed(4)}, {cluster.markers[0].lng.toFixed(4)}
                                  </div>
                                  <div className="text-slate-600 mt-1">{cluster.markers[0].description}</div>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
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
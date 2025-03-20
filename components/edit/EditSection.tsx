import { Separator } from '@radix-ui/react-separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs'
import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Loader2, AlertCircle } from 'lucide-react';

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

interface EditSectionProps {
  subtitles: Subtitle[];
}

const EditSection = ({ subtitles = [] }: EditSectionProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if subtitles are loaded
    setLoading(false);
    
    // Log subtitle information for debugging
    console.log(`EditSection: Received ${subtitles.length} subtitles`);
    if (subtitles.length > 0) {
      console.log('First subtitle:', subtitles[0]);
      console.log('Last subtitle:', subtitles[subtitles.length - 1]);
    }
  }, [subtitles]);

  // Function to format time in MM:SS format
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
        <h2 className="text-xl font-semibold mb-4">Captions</h2>
          <Tabs defaultValue="captions" className="w-full">
            <TabsList className="w-full flex justify-around">
              <TabsTrigger value="captions">Captions</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="captions" className="mt-4">
              {loading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-500">{error}</p>
                  </CardContent>
                </Card>
              ) : subtitles.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {subtitles.map((subtitle, index) => (
                    <Card key={index} className="hover:bg-gray-50 transition-colors">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500 mb-1">
                          {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
                        </p>
                        <p className="text-lg">{subtitle.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500 mb-2">No captions available</p>
                    <p className="text-sm text-gray-400">
                      Subtitles could not be loaded for this video.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="models">
              <Card>
                <CardContent className="p-4">
                  <p>Model settings will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="style">
              <Card>
                <CardContent className="p-4">
                  <p>Style settings will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="export">
              <Card>
                <CardContent className="p-4">
                  <p>Export options will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
    </div>
  )
}

export default EditSection
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import JitsiSettings from '@/lib/mongodb/models/JitsiSettings';

/**
 * GET /api/jitsi-settings/public
 * Get default Jitsi settings for public use (no auth required)
 */
export async function GET() {
  try {
    await connectDB();

    // Get default active settings
    const settings = await JitsiSettings.findOne({ isDefault: true, isActive: true });

    if (!settings) {
      // Return optimized default settings if none exist
      return NextResponse.json({
        success: true,
        settings: {
          resolution: 360,
          maxVideoHeight: 480,
          maxVideoWidth: 854,
          startWithVideoMuted: true,
          startWithAudioMuted: true,
          enableNoAudioDetection: true,
          enableNoisyMicDetection: true,
          disableSimulcast: false,
          enableLayerSuspension: true,
          p2pEnabled: true,
          prejoinPageEnabled: false,
          showJitsiWatermark: false,
          showBrandWatermark: false,
          disableVideoBackground: true,
          numberOfVisibleTiles: 4,
          maxTileViewColumns: 2,
          filmStripMaxHeight: 90,
          analyticsDisabled: true,
          disableDeepLinking: true,
          disableInviteFunctions: true,
          doNotStoreRoom: true,
          toolbarButtons: [
            'microphone',
            'camera',
            'desktop',
            'fullscreen',
            'hangup',
            'chat',
            'tileview'
          ],
        },
      });
    }

    // Return settings without sensitive metadata
    return NextResponse.json({
      success: true,
      settings: {
        resolution: settings.resolution,
        maxVideoHeight: settings.maxVideoHeight,
        maxVideoWidth: settings.maxVideoWidth,
        startWithVideoMuted: settings.startWithVideoMuted,
        startWithAudioMuted: settings.startWithAudioMuted,
        enableNoAudioDetection: settings.enableNoAudioDetection,
        enableNoisyMicDetection: settings.enableNoisyMicDetection,
        disableSimulcast: settings.disableSimulcast,
        enableLayerSuspension: settings.enableLayerSuspension,
        p2pEnabled: settings.p2pEnabled,
        prejoinPageEnabled: settings.prejoinPageEnabled,
        showJitsiWatermark: settings.showJitsiWatermark,
        showBrandWatermark: settings.showBrandWatermark,
        disableVideoBackground: settings.disableVideoBackground,
        numberOfVisibleTiles: settings.numberOfVisibleTiles,
        maxTileViewColumns: settings.maxTileViewColumns,
        filmStripMaxHeight: settings.filmStripMaxHeight,
        analyticsDisabled: settings.analyticsDisabled,
        disableDeepLinking: settings.disableDeepLinking,
        disableInviteFunctions: settings.disableInviteFunctions,
        doNotStoreRoom: settings.doNotStoreRoom,
        toolbarButtons: settings.toolbarButtons,
      },
    });

  } catch (error) {
    console.error('Error fetching public Jitsi settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

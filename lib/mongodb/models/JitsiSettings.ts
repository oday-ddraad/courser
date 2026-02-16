import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJitsiSettings extends Document {
  // Video Settings
  resolution: number;
  maxVideoHeight: number;
  maxVideoWidth: number;
  startWithVideoMuted: boolean;
  
  // Audio Settings
  startWithAudioMuted: boolean;
  enableNoAudioDetection: boolean;
  enableNoisyMicDetection: boolean;
  
  // Performance Settings
  disableSimulcast: boolean;
  enableLayerSuspension: boolean;
  p2pEnabled: boolean;
  
  // UI Settings
  prejoinPageEnabled: boolean;
  showJitsiWatermark: boolean;
  showBrandWatermark: boolean;
  disableVideoBackground: boolean;
  
  // Tile View Settings
  numberOfVisibleTiles: number;
  maxTileViewColumns: number;
  filmStripMaxHeight: number;
  
  // Features
  analyticsDisabled: boolean;
  disableDeepLinking: boolean;
  disableInviteFunctions: boolean;
  doNotStoreRoom: boolean;
  
  // Toolbar Buttons
  toolbarButtons: string[];
  
  // Multilingual Labels
  labels: {
    en: {
      name: string;
      description: string;
    };
    de: {
      name: string;
      description: string;
    };
    ar: {
      name: string;
      description: string;
    };
  };
  
  // Metadata
  isDefault: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JitsiSettingsSchema = new Schema<IJitsiSettings>(
  {
    // Video Settings
    resolution: {
      type: Number,
      default: 360,
      enum: [180, 240, 360, 480, 720, 1080],
    },
    maxVideoHeight: {
      type: Number,
      default: 720,
    },
    maxVideoWidth: {
      type: Number,
      default: 1280,
    },
    startWithVideoMuted: {
      type: Boolean,
      default: true,
    },
    
    // Audio Settings
    startWithAudioMuted: {
      type: Boolean,
      default: true,
    },
    enableNoAudioDetection: {
      type: Boolean,
      default: true,
    },
    enableNoisyMicDetection: {
      type: Boolean,
      default: true,
    },
    
    // Performance Settings
    disableSimulcast: {
      type: Boolean,
      default: false,
    },
    enableLayerSuspension: {
      type: Boolean,
      default: true,
    },
    p2pEnabled: {
      type: Boolean,
      default: true,
    },
    
    // UI Settings
    prejoinPageEnabled: {
      type: Boolean,
      default: false,
    },
    showJitsiWatermark: {
      type: Boolean,
      default: false,
    },
    showBrandWatermark: {
      type: Boolean,
      default: false,
    },
    disableVideoBackground: {
      type: Boolean,
      default: true,
    },
    
    // Tile View Settings
    numberOfVisibleTiles: {
      type: Number,
      default: 4,
      min: 1,
      max: 25,
    },
    maxTileViewColumns: {
      type: Number,
      default: 2,
      min: 1,
      max: 5,
    },
    filmStripMaxHeight: {
      type: Number,
      default: 90,
      min: 50,
      max: 200,
    },
    
    // Features
    analyticsDisabled: {
      type: Boolean,
      default: true,
    },
    disableDeepLinking: {
      type: Boolean,
      default: true,
    },
    disableInviteFunctions: {
      type: Boolean,
      default: true,
    },
    doNotStoreRoom: {
      type: Boolean,
      default: true,
    },
    
    // Toolbar Buttons
    toolbarButtons: {
      type: [String],
      default: [
        'microphone',
        'camera',
        'desktop',
        'fullscreen',
        'hangup',
        'chat',
        'tileview',
      ],
    },
    
    // Multilingual Labels
    labels: {
      en: {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
      },
      de: {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
      },
      ar: {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
      },
    },
    
    // Metadata
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
JitsiSettingsSchema.index({ isDefault: 1, isActive: 1 });
JitsiSettingsSchema.index({ createdBy: 1 });

const JitsiSettings: Model<IJitsiSettings> =
  mongoose.models.JitsiSettings || 
  mongoose.model<IJitsiSettings>('JitsiSettings', JitsiSettingsSchema);

export default JitsiSettings;

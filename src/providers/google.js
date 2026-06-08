import { BaseTTSProvider } from './base.js';

export class GoogleTTSProvider extends BaseTTSProvider {
  constructor(config) {
    super(config);
    this.client = null;
  }

  async _getClient() {
    if (!this.client) {
      let mod;
      try {
        mod = await import('@google-cloud/text-to-speech');
      } catch {
        throw new Error(
          'The Google Cloud TTS provider needs the optional "@google-cloud/text-to-speech" dependency, ' +
          'which is not installed. Install it with: npm install @google-cloud/text-to-speech'
        );
      }
      this.client = new mod.TextToSpeechClient();
    }
    return this.client;
  }

  async synthesize(text) {
    const client = await this._getClient();
    const cfg = this.config.google || {};

    const request = {
      input: { text },
      voice: {
        languageCode: cfg.languageCode || 'en-US',
        name: cfg.voice || 'en-US-Neural2-D',
      },
      audioConfig: {
        audioEncoding: cfg.audioEncoding || 'LINEAR16',
        sampleRateHertz: cfg.sampleRateHertz || 24000,
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    return {
      audio: Buffer.from(response.audioContent),
      format: 'wav',
    };
  }

  async validate() {
    try {
      const result = await this.synthesize('test');
      if (result.audio && result.audio.length > 0) {
        return { ok: true };
      }
      return { ok: false, error: 'Empty audio response' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  get audioExtension() {
    return 'wav';
  }
}

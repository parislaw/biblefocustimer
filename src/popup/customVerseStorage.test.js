import { getCustomVerses, setCustomVerses } from './customVerseStorage';

describe('customVerseStorage', () => {
  beforeEach(() => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((key, cb) => cb({ customVerses: [] })),
          set: jest.fn((payload, cb) => cb && cb()),
        },
      },
      runtime: {
        lastError: null,
      },
    };
  });

  it('getCustomVerses returns empty array when nothing stored', (done) => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    getCustomVerses((verses) => {
      expect(verses).toEqual([]);
      done();
    });
  });

  it('setCustomVerses calls chrome.storage.local.set with customVerses', (done) => {
    const list = [{ id: 'c1', theme: 'custom', reference: 'John 1:1', esv: 'In the beginning...' }];
    setCustomVerses(list, () => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ customVerses: list }, expect.any(Function));
      done();
    });
  });

  it('getCustomVerses handles chrome.runtime.lastError gracefully', (done) => {
    chrome.runtime = { lastError: { message: 'Storage quota exceeded' } };
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    getCustomVerses((verses) => {
      expect(verses).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load custom verses:',
        expect.any(Object)
      );
      consoleSpy.mockRestore();
      done();
    });
  });

  it('setCustomVerses handles chrome.runtime.lastError gracefully', (done) => {
    chrome.runtime = { lastError: { message: 'Storage quota exceeded' } };
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    setCustomVerses([{ id: 'c1' }], () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save custom verses:',
        expect.any(Object)
      );
      consoleSpy.mockRestore();
      done();
    });
  });
});

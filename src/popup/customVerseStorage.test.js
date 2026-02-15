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
});

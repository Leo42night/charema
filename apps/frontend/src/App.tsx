import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { z } from 'zod';
import { Send, Bot, User, Search, Check, X } from 'lucide-react';

const NomorIndukSchema = z
  .string()
  .startsWith("H11", "Nomor Induk harus diawali H11");


// Dummy Backend Data
const dummyDatabase = {
  'H11001234': { nama: 'Budi Santoso', jurusan: 'Teknik Informatika' },
  'H11005678': { nama: 'Siti Nurhaliza', jurusan: 'Sistem Informasi' },
  'H11009876': { nama: 'Ahmad Rizki', jurusan: 'Teknik Komputer' },
};

// Dummy Mata Kuliah Data
interface MataKuliah {
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  dosen: string;
}

const dummyMataKuliah: MataKuliah[] = [
  { kode: 'TIF101', nama: 'Pemrograman Dasar', sks: 3, semester: 1, dosen: 'Dr. Ahmad' },
  { kode: 'TIF102', nama: 'Struktur Data', sks: 3, semester: 2, dosen: 'Dr. Budi' },
  { kode: 'TIF103', nama: 'Algoritma dan Pemrograman', sks: 4, semester: 1, dosen: 'Dr. Citra' },
  { kode: 'TIF201', nama: 'Basis Data', sks: 3, semester: 3, dosen: 'Dr. Dewi' },
  { kode: 'TIF202', nama: 'Pemrograman Web', sks: 3, semester: 3, dosen: 'Dr. Eko' },
  { kode: 'TIF203', nama: 'Jaringan Komputer', sks: 3, semester: 4, dosen: 'Dr. Fani' },
  { kode: 'TIF301', nama: 'Kecerdasan Buatan', sks: 3, semester: 5, dosen: 'Dr. Gani' },
  { kode: 'TIF302', nama: 'Machine Learning', sks: 4, semester: 6, dosen: 'Dr. Hana' },
  { kode: 'TIF303', nama: 'Sistem Operasi', sks: 3, semester: 4, dosen: 'Dr. Irfan' },
  { kode: 'TIF304', nama: 'Rekayasa Perangkat Lunak', sks: 3, semester: 5, dosen: 'Dr. Joko' },
];

// Types
interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  options?: string[];
  mataKuliahList?: MataKuliah[];
  showSearch?: boolean;
}

interface ChatState {
  messages: Message[];
  currentStep: 'ask_nomor' | 'show_options' | 'search_matkul' | 'confirm_matkul' | 'idle';
  nomorInduk: string | null;
  userData: { nama: string; jurusan: string } | null;
  selectedMataKuliah: MataKuliah[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  setStep: (step: ChatState['currentStep']) => void;
  setNomorInduk: (nomor: string | null) => void;
  setUserData: (data: { nama: string; jurusan: string } | null) => void;
  addSelectedMataKuliah: (mk: MataKuliah) => void;
  removeSelectedMataKuliah: (kode: string) => void;
  clearSelectedMataKuliah: () => void;
  reset: () => void;
}

// Zustand Store
const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentStep: 'idle',
  nomorInduk: null,
  userData: null,
  selectedMataKuliah: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: Date.now().toString(), timestamp: new Date() },
      ],
    })),
  setStep: (step) => set({ currentStep: step }),
  setNomorInduk: (nomor) => set({ nomorInduk: nomor }),
  setUserData: (data) => set({ userData: data }),
  addSelectedMataKuliah: (mk) =>
    set((state) => ({
      selectedMataKuliah: [...state.selectedMataKuliah, mk],
    })),
  removeSelectedMataKuliah: (kode) =>
    set((state) => ({
      selectedMataKuliah: state.selectedMataKuliah.filter((mk) => mk.kode !== kode),
    })),
  clearSelectedMataKuliah: () => set({ selectedMataKuliah: [] }),
  reset: () =>
    set({
      messages: [],
      currentStep: 'idle',
      nomorInduk: null,
      userData: null,
      selectedMataKuliah: [],
    }),
}));

// Dummy API Functions
const checkNomorInduk = async (nomor: string) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return dummyDatabase[nomor as keyof typeof dummyDatabase] || null;
};

const searchMataKuliah = async (keyword: string): Promise<MataKuliah[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const lowerKeyword = keyword.toLowerCase();
  return dummyMataKuliah.filter(
    (mk) =>
      mk.nama.toLowerCase().includes(lowerKeyword) ||
      mk.kode.toLowerCase().includes(lowerKeyword) ||
      mk.dosen.toLowerCase().includes(lowerKeyword)
  );
};

const submitMataKuliah = async (mataKuliahList: MataKuliah[]) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Data dikirim ke backend:', mataKuliahList);
  return {
    success: true,
    message: 'Pendaftaran mata kuliah berhasil!',
    data: mataKuliahList,
  };
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<MataKuliah[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    currentStep,
    nomorInduk,
    userData,
    selectedMataKuliah,
    addMessage,
    setStep,
    setNomorInduk,
    setUserData,
    addSelectedMataKuliah,
    removeSelectedMataKuliah,
    clearSelectedMataKuliah,
  } = useChatStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage({
          text: 'Selamat datang! Saya akan membantu Anda. Silakan masukkan Nomor Induk Anda.',
          sender: 'bot',
        });
        setStep('ask_nomor');
      }, 500);
    }
  });

  const botReply = async (userMessage: string) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (currentStep === 'ask_nomor') {
      // Validasi nomor induk
      const validation = NomorIndukSchema.safeParse(userMessage);
      
      if (!validation.success) {
        addMessage({
          text: 'Format Nomor Induk tidak valid. Harap gunakan format: H11xxxxxxx (contoh: H11001234)',
          sender: 'bot',
        });
        setIsTyping(false);
        return;
      }

      // Cek di database
      const data = await checkNomorInduk(userMessage);
      
      if (!data) {
        addMessage({
          text: 'Nomor Induk tidak ditemukan. Silakan coba lagi dengan format: H11xxxxxxx',
          sender: 'bot',
        });
        setIsTyping(false);
        return;
      }

      // Data ditemukan
      setNomorInduk(userMessage);
      setUserData(data);
      
      addMessage({
        text: `Data ditemukan!\n\nNama: ${data.nama}\nJurusan: ${data.jurusan}\n\nSilakan pilih aksi selanjutnya:`,
        sender: 'bot',
        options: [
          '1. Lihat Detail Lengkap',
          '2. Update Data',
          '3. Daftar Mata Kuliah',
          '4. Cetak Kartu',
          '5. Mulai Ulang',
        ],
      });
      
      setStep('show_options');
    } else if (currentStep === 'show_options') {
      // Handle pilihan opsi
      const choice = userMessage.trim();
      
      switch (choice) {
        case '1':
          addMessage({
            text: `Detail lengkap untuk ${userData?.nama}:\n\n- Nomor Induk: ${nomorInduk}\n- Nama: ${userData?.nama}\n- Jurusan: ${userData?.jurusan}\n- Status: Aktif\n\nKetik nomor untuk memilih aksi lain.`,
            sender: 'bot',
            options: [
              '2. Update Data',
              '3. Daftar Mata Kuliah',
              '4. Cetak Kartu',
              '5. Mulai Ulang',
            ],
          });
          break;
        case '2':
          addMessage({
            text: 'Fitur update data sedang dalam pengembangan. Ketik nomor untuk memilih aksi lain.',
            sender: 'bot',
            options: [
              '1. Lihat Detail Lengkap',
              '3. Daftar Mata Kuliah',
              '4. Cetak Kartu Rekomendasi',
              '5. Mulai Ulang',
            ],
          });
          break;
        case '3':
          addMessage({
            text: 'Silakan cari mata kuliah yang ingin Anda daftarkan. Ketik nama atau kode mata kuliah untuk mencari.',
            sender: 'bot',
            showSearch: true,
          });
          setStep('search_matkul');
          break;
        case '4':
          addMessage({
            text: 'Kartu sedang diproses... ✓\n\nKartu berhasil dicetak! Silakan ambil di bagian administrasi.\n\nKetik nomor untuk memilih aksi lain.',
            sender: 'bot',
            options: [
              '1. Lihat Detail Lengkap',
              '2. Update Data',
              '3. Daftar Mata Kuliah',
              '5. Mulai Ulang',
            ],
          });
          break;
        case '5':
          setNomorInduk(null);
          setUserData(null);
          clearSelectedMataKuliah();
          addMessage({
            text: 'Sesi direset. Silakan masukkan Nomor Induk Anda.',
            sender: 'bot',
          });
          setStep('ask_nomor');
          break;
        default:
          addMessage({
            text: 'Pilihan tidak valid. Silakan pilih nomor 1-5.',
            sender: 'bot',
            options: [
              '1. Lihat Detail Lengkap',
              '2. Update Data',
              '3. Daftar Mata Kuliah',
              '4. Cetak Kartu',
              '5. Mulai Ulang',
            ],
          });
      }
    } else if (currentStep === 'search_matkul') {
      // User sedang mencari mata kuliah
      if (userMessage.toLowerCase() === 'selesai' || userMessage.toLowerCase() === 'konfirmasi') {
        if (selectedMataKuliah.length === 0) {
          addMessage({
            text: 'Anda belum memilih mata kuliah apapun. Silakan cari dan pilih mata kuliah terlebih dahulu.',
            sender: 'bot',
          });
        } else {
          setStep('confirm_matkul');
          const totalSKS = selectedMataKuliah.reduce((sum, mk) => sum + mk.sks, 0);
          const matkul = selectedMataKuliah.map(
            (mk, idx) => `${idx + 1}. ${mk.kode} - ${mk.nama} (${mk.sks} SKS)\n   Dosen: ${mk.dosen}`
          ).join('\n\n');
          
          addMessage({
            text: `Konfirmasi Mata Kuliah yang Dipilih:\n\n${matkul}\n\nTotal SKS: ${totalSKS}\n\nApakah Anda yakin ingin mendaftar mata kuliah ini?`,
            sender: 'bot',
            options: ['Ya, Daftar', 'Batal'],
          });
        }
      }
    } else if (currentStep === 'confirm_matkul') {
      if (userMessage.toLowerCase().includes('ya') || userMessage.toLowerCase().includes('daftar')) {
        const result = await submitMataKuliah(selectedMataKuliah);
        
        if (result.success) {
          addMessage({
            text: `${result.message}\n\nAnda telah terdaftar untuk ${selectedMataKuliah.length} mata kuliah.\n\nKetik nomor untuk memilih aksi lain.`,
            sender: 'bot',
            options: [
              '1. Lihat Detail Lengkap',
              '2. Update Data',
              '4. Cetak Kartu',
              '5. Mulai Ulang',
            ],
          });
          clearSelectedMataKuliah();
          setStep('show_options');
        }
      } else {
        clearSelectedMataKuliah();
        addMessage({
          text: 'Pendaftaran dibatalkan. Ketik nomor untuk memilih aksi lain.',
          sender: 'bot',
          options: [
            '1. Lihat Detail Lengkap',
            '2. Update Data',
            '3. Daftar Mata Kuliah',
            '4. Cetak Kartu',
            '5. Mulai Ulang',
          ],
        });
        setStep('show_options');
      }
    }
    
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage({ text: userMessage, sender: 'user' });
    setInput('');
    
    await botReply(userMessage);
  };

  const handleOptionClick = async (option: string) => {
    const optionNumber = option.charAt(0);
    addMessage({ text: option, sender: 'user' });
    await botReply(optionNumber);
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    
    const results = await searchMataKuliah(searchKeyword);
    setSearchResults(results);
  };

  const toggleMataKuliah = (mk: MataKuliah) => {
    const isSelected = selectedMataKuliah.some((item) => item.kode === mk.kode);
    if (isSelected) {
      removeSelectedMataKuliah(mk.kode);
    } else {
      addSelectedMataKuliah(mk);
    }
  };

  const handleConfirmSelection = async () => {
    addMessage({ text: 'Konfirmasi', sender: 'user' });
    setSearchKeyword('');
    setSearchResults([]);
    await botReply('konfirmasi');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-150"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Chatbot Assistant</h1>
            <p className="text-blue-100 text-sm">Siap membantu Anda</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {msg.sender === 'bot' && (
                      <Bot className="w-5 h-5 mt-1 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-line">{msg.text}</p>
                      
                      {/* Search Mata Kuliah Interface */}
                      {msg.showSearch && (
                        <div className="mt-4 space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={searchKeyword}
                              onChange={(e) => setSearchKeyword(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                              placeholder="Cari mata kuliah..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <button
                              onClick={handleSearch}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <div className="max-h-60 overflow-y-auto space-y-2 bg-white rounded-lg border border-gray-200 p-2">
                              {searchResults.map((mk) => {
                                const isSelected = selectedMataKuliah.some(
                                  (item) => item.kode === mk.kode
                                );
                                return (
                                  <div
                                    key={mk.kode}
                                    onClick={() => toggleMataKuliah(mk)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-gray-800">
                                            {mk.kode}
                                          </span>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-blue-600" />
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">
                                          {mk.nama}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {mk.sks} SKS • Semester {mk.semester} • {mk.dosen}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Selected Mata Kuliah Summary */}
                          {selectedMataKuliah.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-blue-900">
                                  Dipilih: {selectedMataKuliah.length} mata kuliah
                                </span>
                                <span className="text-sm text-blue-700">
                                  Total: {selectedMataKuliah.reduce((sum, mk) => sum + mk.sks, 0)} SKS
                                </span>
                              </div>
                              <div className="space-y-1">
                                {selectedMataKuliah.map((mk) => (
                                  <div
                                    key={mk.kode}
                                    className="flex justify-between items-center text-xs text-blue-800"
                                  >
                                    <span>
                                      {mk.kode} - {mk.nama}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeSelectedMataKuliah(mk.kode);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={handleConfirmSelection}
                                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Konfirmasi Pilihan
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.options && (
                        <div className="mt-3 space-y-2">
                          {msg.options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleOptionClick(option)}
                              className="w-full text-left px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.sender === 'user' && (
                      <User className="w-5 h-5 mt-1 shrink-0" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-2xl p-3 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <div className="flex gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ketik pesan Anda..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default App;
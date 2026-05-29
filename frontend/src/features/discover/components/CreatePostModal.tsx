import React, { useState } from 'react';
import { X, MapPin, Clock, Users, Loader2 } from 'lucide-react';
import { createPost } from '../api/discoverApi';
import type { Sport, SkillLevel, PostType, CreatePostPayload } from '../types/discover.types';

const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'basketball', label: 'Bóng rổ', emoji: '🏀' },
  { value: 'badminton', label: 'Cầu lông', emoji: '🏸' },
  { value: 'football', label: 'Bóng đá', emoji: '⚽' },
  { value: 'pickleball', label: 'Pickleball', emoji: '🏓' },
  { value: 'volleyball', label: 'Bóng chuyền', emoji: '🏐' },
];

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  casual: 'Giải trí',
  intermediate: 'Bán chuyên',
  competitive: 'Chuyên nghiệp',
};

const POST_TYPE_LABELS: Record<PostType, string> = {
  teammate: 'Tìm đồng đội',
  opponent: 'Tìm đối thủ',
};

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePostModal({ onClose, onCreated }: Props) {
  const [sport, setSport] = useState<Sport>('tennis');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('casual');
  const [playersNeeded, setPlayersNeeded] = useState(1);
  const [type, setType] = useState<PostType>('teammate');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !time || !description.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    setError('');
    setLoading(true);
    const payload: CreatePostPayload = { sport, location, time, skillLevel, playersNeeded, type, description };
    const res = await createPost(payload);
    setLoading(false);
    if (res.success) {
      onCreated();
    } else {
      setError(res.message || 'Đăng bài thất bại.');
    }
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#241914',
    border: '1.5px solid #dfc0b3',
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    fontWeight: 600,
    color: '#241914',
    display: 'block',
    marginBottom: '6px',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(36,25,20,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 60px rgba(36,25,20,0.25)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#dfc0b3]">
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '20px', fontWeight: 700, color: '#241914' }}>
            Tạo bài đăng ghép trận
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors"
            style={{ color: '#584238' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Sport */}
          <div>
            <label style={labelStyle}>Môn thể thao</label>
            <div className="grid grid-cols-3 gap-2">
              {SPORTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSport(s.value)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: sport === s.value ? '#a04100' : '#dfc0b3',
                    background: sport === s.value ? '#fff1eb' : '#fff',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: sport === s.value ? 600 : 400,
                    color: sport === s.value ? '#a04100' : '#584238',
                  }}
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>
              <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
              Địa điểm *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Nhà thi đấu Quận 1, TP.HCM"
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#006a65'; }}
              onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
            />
          </div>

          {/* Time */}
          <div>
            <label style={labelStyle}>
              <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
              Ngày & Giờ *
            </label>
            <input
              type="datetime-local"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#006a65'; }}
              onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
            />
          </div>

          {/* Skill Level */}
          <div>
            <label style={labelStyle}>Cấp độ / Trình độ</label>
            <div className="flex gap-2">
              {(['casual', 'intermediate', 'competitive'] as SkillLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSkillLevel(level)}
                  className="flex-1 py-2 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: skillLevel === level ? '#a04100' : '#dfc0b3',
                    background: skillLevel === level ? '#fff1eb' : '#fff',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: skillLevel === level ? 600 : 400,
                    color: skillLevel === level ? '#a04100' : '#584238',
                  }}
                >
                  {SKILL_LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>Tìm kiếm</label>
            <div className="flex gap-2">
              {(['teammate', 'opponent'] as PostType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="flex-1 py-2 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: type === t ? '#a04100' : '#dfc0b3',
                    background: type === t ? '#fff1eb' : '#fff',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: type === t ? 600 : 400,
                    color: type === t ? '#a04100' : '#584238',
                  }}
                >
                  {POST_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Players needed */}
          <div>
            <label style={labelStyle}>
              <Users size={13} style={{ display: 'inline', marginRight: 4 }} />
              Số lượng người cần tìm
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPlayersNeeded(n)}
                  className="w-10 h-10 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: playersNeeded === n ? '#a04100' : '#dfc0b3',
                    background: playersNeeded === n ? '#fff1eb' : '#fff',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: playersNeeded === n ? '#a04100' : '#584238',
                  }}
                >
                  {n}
                </button>
              ))}
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266' }}>
                người
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Mô tả *</label>
            <textarea
              placeholder="Chia sẻ về trận đấu của bạn, phong cách chơi, yêu cầu tìm bạn chơi..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => { e.target.style.borderColor = '#006a65'; }}
              onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
            />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266', marginTop: 4 }}>
              {description.length}/300 ký tự
            </p>
          </div>

          {error && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ba1a1a' }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-[#dfc0b3] transition-colors hover:bg-[#fff1eb]"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(90deg, #a04100 0%, #ff7e36 100%)',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                border: 'none',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Đăng bài'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

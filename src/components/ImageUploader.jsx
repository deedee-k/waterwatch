import { useState, useRef } from 'react'
import { compressImage } from '../lib/photo'
import { useLanguage } from '../lib/i18n'
import { 
  CameraIcon, 
  UploadCloudIcon, 
  TrashIcon, 
  ImageIcon, 
  CheckCircleIcon, 
  RefreshCwIcon 
} from './Icons'

export default function ImageUploader({ photo: _photo, setPhoto, photoPreview, setPhotoPreview }) {
  const { lang } = useLanguage()
  const [compressing, setCompressing] = useState(false)
  const [fileStats, setFileStats] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  async function processFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    
    setCompressing(true)
    const originalKb = Math.round(file.size / 1024)

    try {
      const compressedBlob = await compressImage(file, 800, 0.7)
      const compressedKb = Math.round(compressedBlob.size / 1024)
      
      setPhoto(compressedBlob)
      setPhotoPreview(URL.createObjectURL(compressedBlob))
      setFileStats({
        name: file.name,
        originalKb,
        compressedKb,
        savings: originalKb > compressedKb ? Math.round(((originalKb - compressedKb) / originalKb) * 100) : 0
      })
    } catch (err) {
      console.error('Image compression error:', err)
    } finally {
      setCompressing(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleRemove() {
    setPhoto(null)
    setPhotoPreview('')
    setFileStats(null)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const isSt = lang === 'st'

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {/* HIDDEN NATIVE INPUTS */}
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*" 
        capture="environment" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      <input 
        ref={galleryInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />

      {/* COMPRESSING LOADING INDICATOR */}
      {compressing && (
        <div style={{ 
          background: 'rgba(0, 174, 239, 0.1)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '2rem', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ animation: 'spin 1s linear infinite' }}>
            <RefreshCwIcon size={28} color="var(--primary)" />
          </div>
          <strong style={{ color: 'var(--text-900)', fontSize: '0.95rem' }}>
            {isSt ? 'E ntse e bobebeletsa setšoantšo...' : 'Optimizing photo for fast upload...'}
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-600)' }}>
            {isSt ? 'E fokotsa boholo ba faele hore e se ke ea ja data ea hau.' : 'Compressing image so it sends instantly without draining mobile data.'}
          </span>
        </div>
      )}

      {/* PHOTO PREVIEW CARD (WHEN PHOTO SELECTED) */}
      {!compressing && photoPreview && (
        <div style={{ 
          background: 'var(--bg-surface)', // <-- Fixed
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative'
        }}>
          <div style={{ position: 'relative', width: '100%', maxHeight: '320px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={photoPreview} 
              alt="Fault Preview" 
              style={{ width: '100%', maxHeight: '320px', objectFit: 'contain' }} 
            />

            {/* OPTIMIZED BADGE */}
            {fileStats && (
              <div style={{ 
                position: 'absolute', 
                top: '12px', 
                left: '12px', 
                background: 'rgba(16, 185, 129, 0.92)', 
                backdropFilter: 'blur(4px)',
                color: 'white', 
                padding: '0.3rem 0.65rem', 
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                <CheckCircleIcon size={14} color="white" />
                <span>
                  {isSt ? `E Bobebe: ${fileStats.compressedKb} KB` : `Optimized: ${fileStats.compressedKb} KB`}
                  {fileStats.savings > 0 && ` (-${fileStats.savings}%)`}
                </span>
              </div>
            )}
          </div>

          <div style={{ 
            padding: '1rem 1.25rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'var(--bg-surface)' // <-- Fixed
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-900)' }}>
                {isSt ? 'Setšoantšo se Kgethiloe' : 'Fault Photo Attached'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-600)' }}>
                {isSt ? 'Litsebi tsa WASCO li tla bona setšoantšo sena pele li fihla.' : 'WASCO technicians will inspect this photo before arriving on-site.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title={isSt ? 'Nka se secha' : 'Retake photo'}
              >
                <CameraIcon size={14} color="currentColor" />
                <span>{isSt ? 'Nka Hape' : 'Retake'}</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  background: 'rgba(220, 38, 38, 0.1)', // <-- Fixed to soft red
                  border: '1px solid rgba(220, 38, 38, 0.2)', // <-- Fixed
                  color: '#F87171',
                  padding: '0.45rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <TrashIcon size={14} color="#F87171" />
                <span>{isSt ? 'Tlosa' : 'Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY / UPLOAD PROMPT STATE */}
      {!compressing && !photoPreview && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{ 
            border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)', // <-- Fixed
            background: isDragging ? 'rgba(0, 174, 239, 0.1)' : 'var(--bg-base)', // <-- Fixed
            borderRadius: 'var(--radius-lg)', 
            padding: '1.75rem 1.25rem', 
            textAlign: 'center',
            transition: 'all 0.2s',
            cursor: 'default'
          }}
        >
          <div style={{ 
            width: '52px', 
            height: '52px', 
            background: 'rgba(0, 174, 239, 0.1)', // <-- Fixed
            color: 'var(--primary)', 
            borderRadius: '50%', 
            display: 'grid', 
            placeItems: 'center', 
            margin: '0 auto 0.75rem auto' 
          }}>
            <UploadCloudIcon size={26} color="var(--primary)" />
          </div>

          <strong style={{ fontSize: '0.95rem', color: 'var(--text-900)', display: 'block', marginBottom: '0.25rem' }}>
            {isSt ? 'Kenya Setšoantšo sa Peipi kapa Pompo' : 'Attach Photo of the Fault (Recommended)'}
          </strong>
          
          <p style={{ fontSize: '0.82rem', color: 'var(--text-600)', margin: '0 0 1.25rem 0', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>
            {isSt 
              ? 'Litšoantšo li thusa litsebi ho bona boholo ba peipi le lisebelisoa tse hlokahalang kapele.' 
              : 'Photos help dispatchers identify pipe size, leak severity, and prepare the correct repair parts.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn-primary-pro"
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                fontSize: '0.85rem', 
                padding: '0.6rem 1.1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <CameraIcon size={18} color="white" />
              <span>{isSt ? 'Nka Setšoantšo (Khamera)' : 'Take Photo (Camera)'}</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="btn-secondary"
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.6rem 1.1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--bg-surface)' // <-- Fixed
              }}
            >
              <ImageIcon size={18} color="var(--text-600)" />
              <span>{isSt ? 'Khetha Faeleng / Gallery' : 'Upload from Files'}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-400)', marginTop: '0.85rem' }}>
            {isSt ? 'Lifomete: JPG, PNG • E hatelloa ka boyona ho boloka data ea hau' : 'Supports JPG, PNG, WEBP • Automatically compressed to save mobile bandwidth'}
          </div>
        </div>
      )}
    </div>
  )
}
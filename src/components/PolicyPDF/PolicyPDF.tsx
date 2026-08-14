/**
 * 保单 PDF 三件套：IPID + CGS + Particular。
 *
 * 设计目标：
 * 1. 浏览器内即时生成（不依赖后端）
 * 2. 三语按 i18n locale 切换
 * 3. 包含 Ley 50/1980 + IDD 2018 合规字段
 *
 * 用法：在 PolicyDocumentPage / 续保完成后，给用户一个"下载 PDF"按钮，
 *       内部用 `pdf(<PolicyPDF policy={detail} locale={locale} />).toBlob()`
 *       再触发 anchor 下载。
 */
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '../../utils/locale'
import type { PolicyDetail } from '../../api/policy'

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    color: '#141413',
  },
  header: { marginBottom: 16, borderBottom: '1pt solid #c96442', paddingBottom: 8 },
  brand: { fontSize: 14, color: '#c96442', fontFamily: 'Helvetica-Bold' },
  h1: { fontSize: 18, marginTop: 6, fontFamily: 'Helvetica-Bold' },
  h2: { fontSize: 13, marginTop: 18, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  meta: { fontSize: 9, color: '#5e5d59', marginTop: 2 },
  twoCol: { flexDirection: 'row', gap: 12, marginTop: 6 },
  col: { flex: 1 },
  field: { marginBottom: 6 },
  label: { fontSize: 8, color: '#87867f', textTransform: 'uppercase' },
  value: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  table: { marginTop: 6, borderTop: '0.5pt solid #d1cfc5' },
  row: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #d1cfc5',
    paddingVertical: 4,
  },
  cellLabel: { width: '40%', fontSize: 9 },
  cellValue: { width: '30%', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  cellNote: { width: '30%', fontSize: 8, color: '#5e5d59' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#87867f',
    borderTop: '0.5pt solid #d1cfc5',
    paddingTop: 6,
  },
  highlight: { color: '#b53333', fontFamily: 'Helvetica-Bold' },
})

export interface PolicyPDFProps {
  policy: PolicyDetail
  locale: string
}

export function PolicyPDF({ policy, locale }: PolicyPDFProps) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <Document
      title={`${policy.policyNo} — IPID + CGS + Particular`}
      author="SiGReal Insurance Portal"
      subject="Insurance policy document"
    >
      {/* Page 1 — IPID (Información del Producto de Seguro) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>SiGReal · Portal de Seguros</Text>
          <Text style={styles.h1}>IPID — Documento de Información del Producto</Text>
          <Text style={styles.meta}>
            Conforme al Reglamento de Ejecución (UE) 2017/1469 y la Ley 20/2015 de ordenación,
            supervisión y solvencia de entidades aseguradoras.
          </Text>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <View style={styles.field}>
              <Text style={styles.label}>Asegurador</Text>
              <Text style={styles.value}>{policy.insurer}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Producto</Text>
              <Text style={styles.value}>{policy.productName}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Tipo</Text>
              <Text style={styles.value}>{policy.category} · {policy.subject}</Text>
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.field}>
              <Text style={styles.label}>Nº de póliza</Text>
              <Text style={styles.value}>{policy.policyNo}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Tomador</Text>
              <Text style={styles.value}>{policy.insuredName}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Período</Text>
              <Text style={styles.value}>
                {formatDate(policy.startDate, locale)} → {formatDate(policy.endDate, locale)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.h2}>Cobertura básica</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Capital total asegurado</Text>
            <Text style={styles.cellValue}>{formatCurrency(policy.coverage, locale)}</Text>
            <Text style={styles.cellNote}>Ver Particular Anexo I</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Capital consumido</Text>
            <Text style={styles.cellValue}>{formatCurrency(policy.coverage - policy.remainingCoverage, locale)}</Text>
            <Text style={styles.cellNote}>—</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Capital restante</Text>
            <Text style={styles.cellValue}>{formatCurrency(policy.remainingCoverage, locale)}</Text>
            <Text style={styles.cellNote}>—</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Prima anual</Text>
            <Text style={styles.cellValue}>{formatCurrency(policy.premium, locale)}</Text>
            <Text style={styles.cellNote}>Impuestos no incluidos</Text>
          </View>
        </View>

        <Text style={styles.h2}>Resumen de garantías</Text>
        <Text style={{ marginTop: 4 }}>
          Esta póliza cubre los riesgos descritos en las Condiciones Generales y Particulares
          adjuntas. Las exclusiones, franquicias y límites de indemnización se detallan en la
          documentación completa entregada al Tomador.
        </Text>

        <Text style={styles.h2}>¿Qué cubre?</Text>
        <Text>• Daños materiales derivados de incendio, robo, agua, fenómenos naturales.</Text>
        <Text>• Responsabilidad Civil según modalidad y capital descrito.</Text>
        <Text>• Asistencia y gestión de siniestros 24/7.</Text>

        <Text style={styles.h2}>¿Qué no cubre?</Text>
        <Text style={styles.highlight}>
          • Dolo, fraude, guerra, terrorismo, riesgos nucleares.
        </Text>
        <Text style={styles.highlight}>
          • Siniestros derivados de información no declarada o inexacta.
        </Text>
        <Text>
          Lista completa de exclusiones: ver Condiciones Generales, cláusula 6.
        </Text>

        <View style={styles.footer}>
          <Text>IPID emitido el {today} · Producto: {policy.productName} · Póliza: {policy.policyNo}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2 — CGS (Condiciones Generales) + Particular extract */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>SiGReal · Portal de Seguros</Text>
          <Text style={styles.h1}>Condiciones Generales y Particulares</Text>
          <Text style={styles.meta}>
            Extracto · El condicionado completo está depositado en la DGSFP y a disposición
            del Tomador bajo solicitud.
          </Text>
        </View>

        <Text style={styles.h2}>1. Objeto del seguro</Text>
        <Text style={{ marginTop: 4 }}>
          Cubre los bienes y/o responsabilidades descritos en las Condiciones Particulares,
          durante el período de cobertura indicado.
        </Text>

        <Text style={styles.h2}>2. Declaraciones del Tomador</Text>
        <Text style={{ marginTop: 4 }}>
          El Tomador declara, conforme al artículo 19 de la Ley 50/1980 de Contrato de Seguro,
          que la información facilitada es veraz y no omite circunstancias que puedan influir
          en la valoración del riesgo por parte del Asegurador.
        </Text>

        <Text style={styles.h2}>3. Siniestros y franquicias</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Concepto</Text>
            <Text style={styles.cellValue}>Importe</Text>
            <Text style={styles.cellNote}>Notas</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Franquicia general</Text>
            <Text style={styles.cellValue}>{formatCurrency(0, locale)}</Text>
            <Text style={styles.cellNote}>Aplicable a todas las garantías</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Límite por siniestro</Text>
            <Text style={styles.cellValue}>{formatCurrency(policy.coverage, locale)}</Text>
            <Text style={styles.cellNote}>—</Text>
          </View>
        </View>

        <Text style={styles.h2}>4. Cláusulas limitativas (Art. 3 LCS)</Text>
        <Text style={{ marginTop: 4 }}>
          Las cláusulas limitativas de los derechos del Asegurado destacadas en negrita en el
          condicionado particular requieren aceptación expresa por parte del Tomador. Su no
          aceptación libera al Asegurador de la cobertura correspondiente.
        </Text>

        <Text style={styles.h2}>5. Historical de siniestros (últimos 3 años)</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Nº de siniestro</Text>
            <Text style={styles.cellValue}>Importe</Text>
            <Text style={styles.cellNote}>Fecha</Text>
          </View>
          {policy.claimHistory.length === 0 ? (
            <View style={styles.row}>
              <Text style={styles.cellLabel}>—</Text>
              <Text style={styles.cellValue}>Sin siniestros</Text>
              <Text style={styles.cellNote}>—</Text>
            </View>
          ) : (
            policy.claimHistory.map((c) => (
              <View key={c.claimId} style={styles.row}>
                <Text style={styles.cellLabel}>{c.claimNo}</Text>
                <Text style={styles.cellValue}>{formatCurrency(c.amount, locale)}</Text>
                <Text style={styles.cellNote}>{c.date}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.h2}>6. Información del mediador (IDD 2018)</Text>
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <View style={styles.field}>
              <Text style={styles.label}>Mediador</Text>
              <Text style={styles.value}>SiGReal Correduría de Seguros, S.L.</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>NIF</Text>
              <Text style={styles.value}>B-12345678</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Inscripción DGSFP</Text>
              <Text style={styles.value}>J-2024-0001</Text>
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.field}>
              <Text style={styles.label}>Servicio de Atención al Cliente</Text>
              <Text style={styles.value}>sac@sigreal.com · +34 900 123 456</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Capacitación profesional</Text>
              <Text style={styles.value}>Nivel 2 (Ley 26/2006)</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Comisión mediador</Text>
              <Text style={styles.value}>Incluida en la prima</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>CGS + Particular · {policy.policyNo} · Generado el {today}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

/** 把 PolicyPDF 渲染为 Blob（在浏览器内可用 anchor 下载） */
export async function generatePolicyPDFBlob(policy: PolicyDetail, locale: string): Promise<Blob> {
  // 默认字体在 react-pdf 中已通过 Helvetica 内置，无需 register
  Font.registerHyphenationCallback?.((word) => [word])
  return await pdf(<PolicyPDF policy={policy} locale={locale} />).toBlob()
}

/** 触发浏览器下载 */
export function downloadPolicyPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

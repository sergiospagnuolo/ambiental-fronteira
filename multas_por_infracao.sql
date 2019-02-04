select status_debito,sum(valor_multa) as valor_total,count(cnpj_cpf) as numero_de_multas from multas
group by infracao
